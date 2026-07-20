using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.AspNetCore.SignalR;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<BdaeyEducat.API.Hubs.NotificationHub> _hubContext;
    private readonly BdaeyEducat.API.Services.Video.VideoService _videoService;
    private readonly BdaeyEducat.API.Services.IPayoutService _payoutService;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(
        ApplicationDbContext context,
        IHubContext<BdaeyEducat.API.Hubs.NotificationHub> hubContext,
        BdaeyEducat.API.Services.Video.VideoService videoService,
        BdaeyEducat.API.Services.IPayoutService payoutService,
        ILogger<SessionsController> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _videoService = videoService;
        _payoutService = payoutService;
        _logger = logger;
    }

    [HttpGet("my-sessions")]
    public async Task<ActionResult<IEnumerable<SessionDto>>> GetMySessions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        try
        {
            var sessions = await _context.Sessions
                .AsNoTracking()
                .Include(s => s.Student)
                .Include(s => s.TeacherProfile)
                    .ThenInclude(t => t!.User)
                .Include(s => s.Booking)
                .Where(s => s.StudentId == userId || s.TeacherProfile!.UserId == userId)
                .OrderByDescending(s => s.ScheduledAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var sessionIds = sessions.Select(s => s.Id).ToList();
            var evaluatedSessionIds = await _context.SessionEvaluations
                .AsNoTracking()
                .Where(e => sessionIds.Contains(e.SessionId))
                .Select(e => e.SessionId)
                .Distinct()
                .ToHashSetAsync();

            return Ok(sessions.Select(s => MapToDto(s, evaluatedSessionIds)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load sessions for user {UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Unable to load sessions." });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateSessionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var session = await _context.Sessions
            .Include(s => s.TeacherProfile)
                .ThenInclude(t => t!.User)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound();

        var isTeacher = session.TeacherProfile?.UserId == userId;
        var isAdmin = User.IsInRole("Admin");
        if (!isTeacher && !isAdmin) return Forbid();

        if (!string.IsNullOrWhiteSpace(dto.RoomUrl) &&
            !string.Equals(dto.RoomUrl, session.RoomUrl, StringComparison.Ordinal))
        {
            return BadRequest(new { message = "Room URLs are managed by the configured video provider." });
        }

        if (!string.IsNullOrWhiteSpace(dto.RecordingUrl) &&
            (!Uri.TryCreate(dto.RecordingUrl, UriKind.Absolute, out var recordingUri) || recordingUri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest(new { message = "RecordingUrl must be an absolute HTTPS URL." });
        }

        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            if (!Enum.TryParse<SessionStatus>(dto.Status, true, out var requestedStatus))
                return BadRequest(new { message = "Invalid session status." });

            var oldStatus = session.Status;
            if (!IsAllowedTransition(oldStatus, requestedStatus, isAdmin))
                return BadRequest(new { message = $"Transition from {oldStatus} to {requestedStatus} is not allowed." });

            if (requestedStatus == SessionStatus.InProgress && oldStatus != SessionStatus.InProgress)
            {
                var timeDiff = session.ScheduledAt - DateTimeOffset.UtcNow;
                if (!isAdmin && timeDiff.TotalMinutes > 15)
                    return BadRequest("لا يمكن بدء الجلسة قبل 15 دقيقة من الموعد المحدد.");

                if (!isAdmin && DateTimeOffset.UtcNow > session.ScheduledAt.AddMinutes(session.DurationMinutes + 30))
                    return BadRequest(new { message = "The session start window has expired." });

                if (string.IsNullOrEmpty(session.RoomUrl))
                {
                    var roomInfo = await _videoService.PrepareSessionAsync(session.Id, userId, isAdmin);
                    session.RoomUrl = roomInfo.RoomUrl;
                }

                session.StartedAt ??= DateTime.UtcNow;
                session.VideoStatus = "live";

                await _hubContext.Clients.Group(session.StudentId).SendAsync(
                    "ReceiveNotification",
                    $"Teacher {session.TeacherProfile?.User?.FullName} has started the session!");
            }

            if (requestedStatus == SessionStatus.Completed && oldStatus != SessionStatus.Completed)
            {
                if (!isAdmin)
                {
                    if (oldStatus != SessionStatus.InProgress || !session.StartedAt.HasValue)
                        return BadRequest(new { message = "A session must be in progress before it can be completed." });

                    var minimumElapsedMinutes = Math.Max(5, Math.Min(30, session.DurationMinutes / 2));
                    if (DateTime.UtcNow < session.StartedAt.Value.AddMinutes(minimumElapsedMinutes))
                    {
                        return BadRequest(new
                        {
                            message = $"The session cannot be completed before {minimumElapsedMinutes} minutes have elapsed."
                        });
                    }
                }

                session.CompletedAt = DateTime.UtcNow;
                session.VideoStatus = "ended";

                // Deliberately do not pay immediately from a teacher-controlled status change.
                // Student rating or the delayed settlement service will finalize the payout idempotently.
            }

            if (requestedStatus == SessionStatus.Cancelled && oldStatus != SessionStatus.Cancelled)
            {
                session.CancelledAt = DateTime.UtcNow;
                session.VideoStatus = "cancelled";
            }

            if (requestedStatus == SessionStatus.NoShow && oldStatus != SessionStatus.NoShow)
            {
                if (!isAdmin && DateTimeOffset.UtcNow < session.ScheduledAt.AddMinutes(session.DurationMinutes))
                    return BadRequest(new { message = "No-show can only be recorded after the session end time." });

                session.CompletedAt = DateTime.UtcNow;
                session.VideoStatus = "ended";
            }

            session.Status = requestedStatus;
        }

        if (!string.IsNullOrWhiteSpace(dto.RecordingUrl))
            session.RecordingUrl = dto.RecordingUrl;

        await _context.SaveChangesAsync();

        if (session.Status == SessionStatus.Completed && session.BookingId != 0)
        {
            var allCompleted = await _context.Sessions
                .Where(s => s.BookingId == session.BookingId)
                .AllAsync(s => s.Status == SessionStatus.Completed);

            if (allCompleted)
            {
                var booking = await _context.Bookings.FindAsync(session.BookingId);
                if (booking != null && booking.Status != BookingStatus.Completed)
                {
                    booking.Status = BookingStatus.Completed;
                    await _context.SaveChangesAsync();
                }
            }
        }

        return NoContent();
    }

    [HttpPost("{id}/review")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> RateSession(int id, [FromBody] ReviewDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var session = await _context.Sessions
            .Include(s => s.TeacherProfile)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null) return NotFound();
        if (session.StudentId != userId) return Forbid();
        if (session.Status != SessionStatus.Completed) return BadRequest("لا يمكن تقييم جلسة لم تكتمل بعد");
        if (session.Rating.HasValue) return BadRequest("تم تقييم الجلسة مسبقاً");

        session.Rating = dto.Rating;
        session.ReviewComment = dto.Comment;
        session.ReviewedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        if (session.TeacherProfile != null)
        {
            var stats = await _context.Sessions
                .Where(s => s.TeacherProfileId == session.TeacherProfileId && s.Rating.HasValue)
                .GroupBy(s => s.TeacherProfileId)
                .Select(g => new
                {
                    Average = g.Average(s => s.Rating!.Value),
                    Count = g.Count()
                })
                .FirstOrDefaultAsync();

            if (stats != null)
            {
                session.TeacherProfile.AverageRating = stats.Average;
                session.TeacherProfile.TotalReviews = stats.Count;
                await _context.SaveChangesAsync();
            }
        }

        await _payoutService.ProcessSessionPayoutAsync(session.Id, "Student");
        return Ok();
    }

    private static bool IsAllowedTransition(SessionStatus current, SessionStatus requested, bool isAdmin)
    {
        if (current == requested) return true;
        if (isAdmin && current is not SessionStatus.Completed and not SessionStatus.Cancelled) return true;

        return current switch
        {
            SessionStatus.Scheduled => requested is SessionStatus.InProgress or SessionStatus.Cancelled or SessionStatus.NoShow,
            SessionStatus.InProgress => requested is SessionStatus.Completed or SessionStatus.Cancelled,
            _ => false
        };
    }

    private static SessionDto MapToDto(Session s, HashSet<int>? evaluatedIds = null) => new()
    {
        Id = s.Id,
        BookingId = s.BookingId,
        StudentId = s.StudentId,
        StudentName = s.Student?.FullName ?? "Unknown",
        TeacherProfileId = s.TeacherProfileId,
        TeacherName = s.TeacherProfile?.User?.FullName ?? "Unknown",
        ScheduledAt = s.ScheduledAt,
        TimezoneId = s.TimezoneId,
        DurationMinutes = s.DurationMinutes,
        Status = s.Status.ToString(),
        BookingStatus = s.Booking?.Status.ToString() ?? "Unknown",
        RoomUrl = s.RoomUrl,
        RecordingUrl = s.RecordingUrl,
        Rating = s.Rating,
        HasEvaluation = evaluatedIds?.Contains(s.Id) ?? false
    };
}
