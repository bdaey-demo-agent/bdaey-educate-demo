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
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly BdaeyEducat.API.Services.IWalletService _walletService;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> _hubContext;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(
        ApplicationDbContext context, 
        BdaeyEducat.API.Services.IWalletService walletService,
        Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> hubContext,
        ILogger<BookingsController> logger)
    {
        _context = context;
        _walletService = walletService;
        _hubContext = hubContext;
        _logger = logger;
    }

    // GET: api/bookings/my-bookings
    [HttpGet("my-bookings")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetMyBookings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var bookings = await _context.Bookings
            .Include(b => b.Student)
            .Include(b => b.TeacherProfile)
                .ThenInclude(t => t!.User)
            .Include(b => b.Package)
            .Include(b => b.Sessions)
            .Where(b => b.StudentId == userId || b.TeacherProfile!.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var dtos = bookings.Select(b => new BookingDto
        {
            Id = b.Id,
            StudentId = b.StudentId,
            StudentName = b.Student?.FullName ?? "",
            TeacherProfileId = b.TeacherProfileId,
            TeacherName = b.TeacherProfile?.User?.FullName ?? "",
            PackageId = b.PackageId,
            PackageName = b.Package?.Name ?? "",
            Status = b.Status.ToString(),
            TotalPrice = b.TotalPrice,
            Currency = b.Currency,
            CreatedAt = b.CreatedAt,
            SessionsCount = b.Sessions.Count
        });

        return Ok(dtos);
    }

    // POST: api/bookings
    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        // Validate package exists
        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Id == dto.PackageId && p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active);

        if (package == null) return NotFound("Package not found");

        var student = await _context.Users.FindAsync(userId);
        if (student == null) return Unauthorized();

        if (!string.Equals(package.AllowedGender, "All", StringComparison.OrdinalIgnoreCase) && 
            !string.Equals(student.Gender, package.AllowedGender, StringComparison.OrdinalIgnoreCase))
        {
            var isMaleRestricted = string.Equals(package.AllowedGender, "Male", StringComparison.OrdinalIgnoreCase);
            var msg = isMaleRestricted 
                ? "This package is for males only and you cannot book it." 
                : "This package is for females only and you cannot book it.";
            return BadRequest(msg);
        }

        // 1. Check Wallet Balance
        if (!await _walletService.HasSufficientFundsAsync(userId, package.Price))
        {
            return BadRequest("Insufficient wallet balance. Please top up to continue.");
        }

        // 2. Prevent Duplicate Booking
        var existingBooking = await _context.Bookings
            .AnyAsync(b => b.StudentId == userId && 
                           b.PackageId == dto.PackageId && 
                           b.Status != BookingStatus.Cancelled && 
                           b.Status != BookingStatus.Completed);
                            
        if (existingBooking)
        {
            return BadRequest("You already have an active booking for this package.");
        }

        var teacherProfile = await _context.TeacherProfiles
            .Include(t => t.User)
            .Where(t => t.Id == dto.TeacherProfileId)
            .FirstOrDefaultAsync();

        if (teacherProfile == null) return NotFound("Teacher not found");
        var teacherUserId = teacherProfile.UserId;

        if (dto.ProposedTimes == null || dto.ProposedTimes.Count == 0)
        {
            return BadRequest("No proposed times provided.");
        }

        if (package.SessionsCount == 0)
        {
            return BadRequest("Package configuration error: SessionsCount is 0.");
        }

        // -------------------------------------------------------------
        // --- VALIDATION: Check for session count and conflicts ---
        // -------------------------------------------------------------
        
        // 0. Calculate expected sessions based on current time (Handle Late Join)
        int expectedSessions = package.SessionsCount;
        if (package.StartDate < DateTime.UtcNow)
        {
            // Late Join Logic: Calculate how many sessions are already "missed"
            // We can use a simplified version of the frontend logic here.
            // Or better, we trust the count if it's less than total, but we must verify it's the MAX POSSIBLE remaining.
            
            // For now, let's just ensure we create AT MOST package.SessionsCount
            // and NOT more than what was proposed.
        }

        if (dto.ProposedTimes.Count > package.SessionsCount)
        {
            return BadRequest($"You selected more slots than allowed ({package.SessionsCount}).");
        }

        // We should ideally block if too few sessions are selected, unless it's a late join.
        // The frontend already calculates the expected count. Let's enforce it here if we can determine it.
        // BUT to be safe and simple: we create exactly as many sessions as proposed (capped by package).
        var sessionsToCreate = Math.Min(dto.ProposedTimes.Count, package.SessionsCount);

        if (sessionsToCreate == 0)
        {
             return BadRequest("Please select at least one slot.");
        }

        var existingStudentSessions = await _context.Sessions
            .Where(s => s.StudentId == userId && 
                        s.Status != SessionStatus.Cancelled && 
                        s.Status != SessionStatus.Completed &&
                        s.ScheduledAt >= DateTime.UtcNow)
            .Select(s => new { s.ScheduledAt, s.DurationMinutes })
            .ToListAsync();

        var occupiedSlots = existingStudentSessions
            .Select(s => (Start: s.ScheduledAt, End: s.ScheduledAt.AddMinutes(s.DurationMinutes)))
            .ToList();

        for (int i = 0; i < sessionsToCreate; i++)
        {
            var newStart = dto.ProposedTimes[i];
            var newStartUtc = newStart.UtcDateTime;
            
            var newEndUtc = newStartUtc.AddMinutes(package.DurationMinutes);

            foreach (var slot in occupiedSlots)
            {
                if (slot.Start < newEndUtc && newStartUtc < slot.End)
                {
                    return BadRequest($"The proposed time ({newStart.ToLocalTime():yyyy-MM-dd HH:mm}) conflicts with another session in your schedule or this booking. Please choose another time.");
                }
            }
            
            occupiedSlots.Add((newStartUtc, newEndUtc));
        }
        // -------------------------------------------------------------

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Create booking
            var booking = new Booking
            {
                StudentId = userId,
                TeacherProfileId = dto.TeacherProfileId,
                PackageId = dto.PackageId,
                TotalPrice = package.Price,
                Status = BookingStatus.Pending
            };

            _context.Bookings.Add(booking);
            // Save first to get ID for transaction reference
            await _context.SaveChangesAsync();

            // 2. Deduct Funds (Payment / Hold)
            await _walletService.ProcessTransactionAsync(
                userId, 
                -package.Price, 
                TransactionType.Payment, 
                $"Payment for Booking #{booking.Id} ({package.Name})",
                booking.Id.ToString()
            );

            // Create sessions for this booking
            var sessions = new List<Session>();
            
            _logger.LogInformation("[CreateBooking] Creating {SessionsToCreate} sessions. Proposed: {ProposedCount}, Package: {SessionsCount}", sessionsToCreate, dto.ProposedTimes.Count, package.SessionsCount);

            for (int i = 0; i < sessionsToCreate; i++)
            {
                var scheduledAt = dto.ProposedTimes[i]; 
                
                var session = new Session
                {
                    BookingId = booking.Id,
                    StudentId = userId,
                    TeacherProfileId = dto.TeacherProfileId,
                    // Store as UTC
                    ScheduledAt = scheduledAt.UtcDateTime,
                    TimezoneId = dto.TimezoneId,
                    DurationMinutes = package.DurationMinutes,
                    Status = SessionStatus.Scheduled,
                    RoomUrl = null, // Generated when session starts
                    
                    // Financial Snapshot
                    Price = (decimal)package.Price / sessionsToCreate, // Base price per session
                    IsPaidToTeacher = false
                };
                sessions.Add(session);
            }

            _context.Sessions.AddRange(sessions);
            await _context.SaveChangesAsync();
            
            // Notify Teacher (DB)
            var notifMessage = $"New booking request from a student. Package: {package.Name}";
            _context.Notifications.Add(new Notification
            {
                UserId = teacherUserId,
                Title = "New Booking Request",
                Message = notifMessage,
                Type = "Booking",
                RelatedEntityId = booking.Id.ToString()
            });
            await _context.SaveChangesAsync(); 
            
            await transaction.CommitAsync();

            // SignalR
            await _hubContext.Clients.Group(teacherUserId).SendAsync("ReceiveNotification", notifMessage);

            // Response DTO
            var responseDto = new BookingDto
            {
                Id = booking.Id,
                StudentId = booking.StudentId,
                StudentName = student?.FullName ?? "Me",
                TeacherProfileId = booking.TeacherProfileId,
                TeacherName = teacherProfile?.User?.FullName ?? "Teacher",
                PackageId = booking.PackageId,
                PackageName = package.Name,
                Status = booking.Status.ToString(),
                TotalPrice = booking.TotalPrice,
                Currency = booking.Currency,
                CreatedAt = booking.CreatedAt,
                SessionsCount = sessions.Count
            };

            return CreatedAtAction(nameof(GetMyBookings), new { id = booking.Id }, responseDto);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "[BOOKING ERROR]");
            return StatusCode(500, "An internal server error occurred while processing the booking.");
        }
    }

    // PUT: api/bookings/{id}/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Teacher,Student")]
    public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] BookingStatusDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var booking = await _context.Bookings
                .Include(b => b.TeacherProfile)
                .Include(b => b.Package) // Ensure we know the price for refund
                .FirstOrDefaultAsync(b => b.Id == id); 

            if (booking == null) return NotFound();

            // Verify user has permission
            var isTeacher = booking.TeacherProfile?.UserId == userId;
            var isStudent = booking.StudentId == userId;

            if (!isTeacher && !isStudent) return Forbid();

            // Update status
            if (!Enum.TryParse<BookingStatus>(dto.Status, true, out var newStatus))
            {
                return BadRequest("Invalid status");
            }

            var oldStatus = booking.Status;
            booking.Status = newStatus;

            if (newStatus == BookingStatus.Confirmed && oldStatus != BookingStatus.Confirmed)
            {
                booking.ConfirmedAt = DateTime.UtcNow;
                
                var msg = "Your booking request has been confirmed!";
                _context.Notifications.Add(new Notification
                {
                     UserId = booking.StudentId,
                     Title = "Booking Confirmed",
                     Message = msg,
                     Type = "Booking",
                     RelatedEntityId = booking.Id.ToString()
                });

                await _hubContext.Clients.Group(booking.StudentId).SendAsync("ReceiveNotification", msg);

                // --- Payment Release Logic REMOVED ---
                // Payment is now handled in SessionsController after completion and rating.
                // We only handle refunds for Late Joining here if needed, but for now let's simplify.
                
                // 0. Handle Late Joining (Partial Refund) - Keep this as it is a refund to student
                var sessionsCount = await _context.Sessions.CountAsync(s => s.BookingId == booking.Id);
                var packageSessions = booking.Package?.SessionsCount ?? sessionsCount;
                
                if (packageSessions > 0 && sessionsCount < packageSessions)
                {
                    var missedSessions = packageSessions - sessionsCount;
                    var refundAmount = (booking.TotalPrice / packageSessions) * missedSessions;
                    
                    if (refundAmount > 0)
                    {
                        await _walletService.ProcessTransactionAsync(
                            booking.StudentId,
                            refundAmount,
                            TransactionType.Refund,
                            $"Partial refund for {missedSessions} missed sessions (Late Join)",
                            booking.Id.ToString()
                        );
                        
                        // Notify student about refund
                        var refundMsg = $"{refundAmount} {booking.Currency} was refunded to your wallet for the missed sessions.";
                        _context.Notifications.Add(new Notification
                        {
                             UserId = booking.StudentId,
                             Title = "Partial Refund",
                             Message = refundMsg,
                             Type = "Wallet",
                             RelatedEntityId = booking.Id.ToString()
                        });
                    }
                }
                
                // Teacher Payment is deferred to Session Completion & Rating
                _logger.LogInformation("[PAYMENT] Payment deferred until completion.");
                // -----------------------------
            }
            else if (newStatus == BookingStatus.Confirmed)
            {
                 // Already confirmed
                 _logger.LogInformation("[PAYMENT] Booking #{Id} already confirmed. Skipping payment.", id);
            }
            else if (newStatus == BookingStatus.Cancelled)
            {
                booking.CancelledAt = DateTime.UtcNow;
                booking.CancellationReason = dto.Reason;
                
                if (oldStatus != BookingStatus.Cancelled) // Prevent double refund
                {
                     await _walletService.ProcessTransactionAsync(
                        booking.StudentId, 
                        booking.TotalPrice, 
                        TransactionType.Refund, 
                        $"Refund for Booking #{booking.Id}",
                        booking.Id.ToString()
                    );
                }

                // Cancel sessions
                var sessions = await _context.Sessions
                    .Where(s => s.BookingId == booking.Id && s.Status != SessionStatus.Completed)
                    .ToListAsync();

                foreach (var session in sessions)
                {
                    session.Status = SessionStatus.Cancelled;
                    session.CancelledAt = DateTime.UtcNow;
                }
                
                var targetUserId = isTeacher ? booking.StudentId : booking.TeacherProfile!.UserId;
                var cancelMsg = $"Booking #{booking.Id} has been cancelled.";
                 _context.Notifications.Add(new Notification
                {
                     UserId = targetUserId,
                     Title = "Booking Cancelled",
                     Message = cancelMsg,
                     Type = "Booking",
                     RelatedEntityId = booking.Id.ToString()
                });
                await _hubContext.Clients.Group(targetUserId).SendAsync("ReceiveNotification", cancelMsg);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "[BOOKING STATUS ERROR]");
            return StatusCode(500, "An error occurred while updating booking status.");
        }
    }
}
