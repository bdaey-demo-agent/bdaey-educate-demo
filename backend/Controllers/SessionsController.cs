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
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> _hubContext;
    private readonly BdaeyEducat.API.Services.Video.VideoService _videoService;
    private readonly BdaeyEducat.API.Services.IWalletService _walletService;
    private readonly BdaeyEducat.API.Services.IPayoutService _payoutService;
    private readonly Microsoft.Extensions.Logging.ILogger<SessionsController> _logger;

    public SessionsController(
        ApplicationDbContext context,
        Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> hubContext,
        BdaeyEducat.API.Services.Video.VideoService videoService,
        BdaeyEducat.API.Services.IWalletService walletService,
        BdaeyEducat.API.Services.IPayoutService payoutService,
        Microsoft.Extensions.Logging.ILogger<SessionsController> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _videoService = videoService;
        _walletService = walletService;
        _payoutService = payoutService;
        _logger = logger;
    }

    // GET: api/sessions/my-sessions
    [HttpGet("my-sessions")]
    public async Task<ActionResult<IEnumerable<SessionDto>>> GetMySessions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        _logger.LogInformation("[GetMySessions] Request for User: {UserId}", userId);

        try 
        {
            var sessions = await _context.Sessions
                .Include(s => s.Student)
                .Include(s => s.TeacherProfile)
                    .ThenInclude(t => t!.User)
                .Include(s => s.Booking)
                .Where(s => s.StudentId == userId || s.TeacherProfile!.UserId == userId)
                .OrderByDescending(s => s.ScheduledAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            _logger.LogInformation("[GetMySessions] Found {Count} sessions.", sessions.Count);

            // Fetch evaluated session IDs separately to avoid circular include
            var sessionIds = sessions.Select(s => s.Id).ToList();
            var evaluatedSessionIds = await _context.SessionEvaluations
                .Where(e => sessionIds.Contains(e.SessionId))
                .Select(e => e.SessionId)
                .Distinct()
                .ToHashSetAsync();

            return Ok(sessions.Select(s => MapToDto(s, evaluatedSessionIds)));
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "[GetMySessions] ERROR: {Message}", ex.Message);
             return StatusCode(500, ex.Message);
        }
    }

    // PUT: api/sessions/{id}
    [HttpPut("{id}")]
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

        // Check authorization: Teacher can update status and links
        var isTeacher = session.TeacherProfile?.UserId == userId;
        
        // Students can technically update? Maybe only to cancel or rate? 
        // For now, let's restrict major updates to Teachers.
        if (!isTeacher) return Forbid();

        if (dto.Status != null && Enum.TryParse<SessionStatus>(dto.Status, true, out var status))
        {
            var oldStatus = session.Status;
            session.Status = status;


            if (status == SessionStatus.InProgress)
            {
                // Validation: Cannot start session too early (e.g. more than 15 mins before)
                var timeDiff = session.ScheduledAt - DateTime.UtcNow;
                if (timeDiff.TotalMinutes > 15)
                {
                    return BadRequest("جاري الانتظار... لا يمكن بدء الجلسة قبل 15 دقيقة من الموعد المحدد.");
                }

                // Auto-generate room URL if missing
                if (string.IsNullOrEmpty(session.RoomUrl))
                {
                    // Use VideoService to prepare the room (e.g. Daily.co)
                    var roomInfo = await _videoService.PrepareSessionAsync(session.Id);
                    // Session is saved inside PrepareSessionAsync, but we maintain the logic here
                    session.RoomUrl = roomInfo.RoomUrl;
                }

                // Notify Student
                await _hubContext.Clients.Group(session.StudentId).SendAsync("ReceiveNotification", $"Teacher {session.TeacherProfile?.User?.FullName} has started the session!");
            }
            
            // PAYOUT TRIGGER: If status changed to Completed
            if (status == SessionStatus.Completed && oldStatus != SessionStatus.Completed)
            {
                await _context.SaveChangesAsync(); // Save status first
                try 
                {
                    await _payoutService.ProcessSessionPayoutAsync(session.Id, "Teacher-Manual-Completion");
                }
                catch(Exception ex)
                {
                    _logger.LogError(ex, "Payout failed for session {SessionId}: {Message}", session.Id, ex.Message);
                }
            }
        }

        if (dto.RoomUrl != null)
        {
            session.RoomUrl = dto.RoomUrl;
        }

        if (dto.RecordingUrl != null)
        {
            session.RecordingUrl = dto.RecordingUrl;
        }

        await _context.SaveChangesAsync();

        // Check if Booking is Completed (All sessions done) - logic unchanged
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
                    
                    // Optional: Notification of completion
                }
            }
        }

        return NoContent();
    }

    // POST: api/sessions/{id}/review
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

        // Validate
        if (session.StudentId != userId) return Forbid();
        if (session.Status != SessionStatus.Completed) return BadRequest("لا يمكن تقييم جلسة لم تكتمل بعد");
        if (session.Rating.HasValue) return BadRequest("تم تقييم الجلسة مسبقاً");

        // Submit Rating
        session.Rating = dto.Rating;
        session.ReviewComment = dto.Comment;
        session.ReviewedAt = DateTime.UtcNow;

        // Save the session rating FIRST so it's included in the calculation
        await _context.SaveChangesAsync();

        // Recalculate Teacher Stats
        if (session.TeacherProfile != null)
        {
            var teacherId = session.TeacherProfileId;
            
            // We need to fetch all rated sessions to calculate average correctly
            // Now this query will include the session we just saved
            var stats = await _context.Sessions
                .Where(s => s.TeacherProfileId == teacherId && s.Rating.HasValue)
                .GroupBy(s => s.TeacherProfileId)
                .Select(g => new { 
                    Average = g.Average(s => s.Rating!.Value), 
                    Count = g.Count() 
                })
                .FirstOrDefaultAsync();

            // Update Teacher Stats with FRESH data
            if (stats != null)
            {
                 session.TeacherProfile.AverageRating = stats.Average;
                 session.TeacherProfile.TotalReviews = stats.Count;
                 await _context.SaveChangesAsync();
            }
        }
        else 
        {
             await _context.SaveChangesAsync();
        }

        // --- Post-Rating Payment Logic ---
        // Trigger payment processing immediately after rating
        await _payoutService.ProcessSessionPayoutAsync(session.Id, "Student");

        return Ok();
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
