using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;
using Microsoft.AspNetCore.SignalR;
using BdaeyEducat.API.Hubs;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Route("api/admin/bookings")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminBookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;
    private readonly IAuditLogService _auditLogService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<AdminBookingsController> _logger;

    public AdminBookingsController(
        ApplicationDbContext context,
        IWalletService walletService,
        IAuditLogService auditLogService,
        IHubContext<NotificationHub> hubContext,
        ILogger<AdminBookingsController> logger)
    {
        _context = context;
        _walletService = walletService;
        _auditLogService = auditLogService;
        _hubContext = hubContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<dynamic>>> ConvertAllBookings()
    {
        // Simple list for now – can add pagination later
        var bookings = await _context.Bookings
            .Include(b => b.Student)
            .Include(b => b.TeacherProfile).ThenInclude(t => t!.User)
            .Include(b => b.Package)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                StudentName = b.Student != null ? b.Student.FullName : "Unknown",
                TeacherName = b.TeacherProfile != null && b.TeacherProfile.User != null ? b.TeacherProfile.User.FullName : "Unknown",
                PackageName = b.Package != null ? b.Package.Name : "Deleted",
                b.Status,
                b.TotalPrice,
                b.Currency,
                b.CreatedAt,
                b.ConfirmedAt,
                b.CancelledAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetBookingDetails(int id)
    {
         var booking = await _context.Bookings
            .Include(b => b.Student)
            .Include(b => b.TeacherProfile).ThenInclude(t => t!.User)
            .Include(b => b.Package)
            .Include(b => b.Sessions)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();

        return Ok(new
        {
            booking.Id,
            Student = new { booking.Student?.Id, booking.Student?.FullName, booking.Student?.Email, booking.Student?.PhoneNumber },
            Teacher = new { booking.TeacherProfile?.Id, booking.TeacherProfile?.User?.FullName, booking.TeacherProfile?.User?.Email },
            Package = new { booking.Package?.Id, booking.Package?.Name },
            booking.Status,
            booking.TotalPrice,
            booking.Currency,
            booking.CreatedAt,
            booking.ConfirmedAt,
            booking.CancelledAt,
            booking.CancellationReason,
            Sessions = booking.Sessions.Select(s => new { s.Id, s.ScheduledAt, s.Status, s.DurationMinutes, s.IsPaidToTeacher })
        });
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> ForceUpdateStatus(int id, [FromBody] BookingStatusDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        // Validates transition
        if (!Enum.TryParse<BookingStatus>(dto.Status, true, out var newStatus))
        {
             return BadRequest("Invalid Status");
        }

        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return NotFound();

        var oldStatus = booking.Status;
        
        // Prevent modifying final states
        if (oldStatus == BookingStatus.Completed || oldStatus == BookingStatus.Cancelled)
        {
            return BadRequest($"Cannot modify booking in '{oldStatus}' state.");
        }

        if (oldStatus == BookingStatus.Cancelled && newStatus == BookingStatus.Confirmed)
        {
            return BadRequest("Cannot move from Cancelled to Confirmed directly.");
        }

        var correlationId = Guid.NewGuid().ToString();

        booking.Status = newStatus;
        if (newStatus == BookingStatus.Confirmed && oldStatus != BookingStatus.Confirmed)
        {
            booking.ConfirmedAt = DateTime.UtcNow;
        }
        
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync(
            adminId!, 
            "UpdateBookingStatus", 
            "Booking", 
            id.ToString(), 
            new { 
                BookingId = id,
                StudentId = booking.StudentId,
                TeacherProfileId = booking.TeacherProfileId,
                OldStatus = oldStatus.ToString(), 
                NewStatus = newStatus.ToString() 
            }, 
            correlationId
        );

        return Ok(new { Message = "Status updated", NewStatus = newStatus.ToString() });
    }

    public class AdminCancelBookingDto
    {
        public string Reason { get; set; } = string.Empty;
        public string RefundMode { get; set; } = "Full"; // Full, Partial, None
        public decimal? RefundAmount { get; set; }
        public string? AdminNote { get; set; }
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id, [FromBody] AdminCancelBookingDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var correlationId = Guid.NewGuid().ToString();

        // 1. Load booking
        var booking = await _context.Bookings
            //.Include(b => b.PaymentTransactions) 
            .FirstOrDefaultAsync(b => b.Id == id);
            
        if (booking == null) return NotFound();

        if (booking.Status == BookingStatus.Cancelled)
            return BadRequest("Booking already cancelled.");

        // Idempotency: Check if already refunded
        var existingRefund = await _context.WalletTransactions
            .AnyAsync(t => t.ReferenceId == id.ToString() && t.Type == TransactionType.Refund);
        
        if (existingRefund) return BadRequest("Booking already refunded.");

        // 2. Validate Refund
        decimal refundAmount = 0;
        // For simplicity, assuming TotalPrice is the paid amount. 
        // In real world, check 'PaymentTransactions' sum.
        decimal maxRefund = booking.TotalPrice; 

        if (dto.RefundMode == "Full")
        {
            refundAmount = maxRefund;
        }
        else if (dto.RefundMode == "Partial")
        {
            if (!dto.RefundAmount.HasValue || dto.RefundAmount <= 0)
                return BadRequest("Partial refund requires positive RefundAmount.");
            
            if (dto.RefundAmount > maxRefund) 
                 return BadRequest($"Refund amount cannot exceed paid amount ({maxRefund}).");

            refundAmount = dto.RefundAmount.Value;
        }

        // 3. Transaction
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // Update Booking
            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = $"Admin Cancel: {dto.Reason}";
            
            await _context.SaveChangesAsync();

            // Process Refund
            if (refundAmount > 0)
            {
                 // We don't have direct _walletService.Refund method that takes explicit amount easily?
                 // Let's use ProcessTransactionAsync with Refund Type.
                 await _walletService.ProcessTransactionAsync(
                     booking.StudentId,
                     refundAmount,
                     TransactionType.Refund,
                     $"Admin Refund for Booking #{id}. Reason: {dto.Reason}",
                     id.ToString(), // Ref ID
                     "System",
                     correlationId // Provider Tx ID as correlation for now or generated
                 );
            }

            // Cancel Sessions
            var sessions = await _context.Sessions
                .Where(s => s.BookingId == id && s.Status != SessionStatus.Completed)
                .ToListAsync();
                
            foreach(var s in sessions)
            {
                s.Status = SessionStatus.Cancelled;
                s.CancelledAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            // Audit
            await _auditLogService.LogAsync(adminId!, "CancelBooking", "Booking", id.ToString(), dto, correlationId);

            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "[AdminCancel] Error");
            return StatusCode(500, "Error cancelling booking.");
        }

        // 4. Post-Commit Notifications
        try
        {
             var msg = $"Booking #{id} was cancelled by the admin team. Reason: {dto.Reason}";
             await _hubContext.Clients.Group(booking.StudentId).SendAsync("ReceiveNotification", msg);
             
             // Notify teacher too
             var teacherId = await _context.TeacherProfiles.Where(t => t.Id == booking.TeacherProfileId).Select(t => t.UserId).FirstOrDefaultAsync();
             if(teacherId != null)
                await _hubContext.Clients.Group(teacherId).SendAsync("ReceiveNotification", msg);
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "[Notification Error]"); // Don't fail request
        }

        return Ok(new { Message = "Booking cancelled", Refunded = refundAmount });
    }
}
