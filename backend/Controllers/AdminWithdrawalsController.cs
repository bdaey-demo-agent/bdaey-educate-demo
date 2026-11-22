using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Route("api/admin/withdrawals")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminWithdrawalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;

    private readonly INotificationService _notificationService;

    public AdminWithdrawalsController(ApplicationDbContext context, IWalletService walletService, INotificationService notificationService)
    {
        _context = context;
        _walletService = walletService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult> GetRequests([FromQuery] WithdrawalFilterDto filter)
    {
        var query = _context.WithdrawalRequests
            .Include(w => w.Teacher)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(w => w.Status == filter.Status.Value);

        if (filter.TeacherId != null)
            query = query.Where(w => w.TeacherId == filter.TeacherId);

        if (filter.DateFrom.HasValue)
            query = query.Where(w => w.RequestedAt >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(w => w.RequestedAt <= filter.DateTo.Value);

        var total = await query.CountAsync();
        
        var items = await query
            .OrderByDescending(w => w.RequestedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(w => new 
            {
                w.Id,
                w.TeacherId,
                TeacherName = w.Teacher!.FullName,
                w.Amount,
                w.Status,
                w.PaymentMethod,
                PaymentDetails = w.PaymentDetails,
                w.RequestedAt,
                w.DecidedAt,
                w.RejectionReason,
                AdminName = w.ProcessedByAdmin != null ? w.ProcessedByAdmin.FullName : null
            })
            .ToListAsync();

        return Ok(new { Items = items, TotalCount = total });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveRequest(int id)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var request = await _context.WithdrawalRequests.FirstOrDefaultAsync(w => w.Id == id);
            if (request == null) return NotFound("Request not found");
            if (request.Status != WithdrawalStatus.Pending) return BadRequest("Request is not pending");

            // 1. Confirm Funds (Deduct from OnHold permanently)
            await _walletService.ConfirmWithdrawalAsync(request.Id.ToString());

            // 2. Update Request
            request.Status = WithdrawalStatus.Approved;
            request.DecidedAt = DateTime.UtcNow;
            request.AdminId = adminId;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Notify Teacher
            await _notificationService.SendToUserAsync(
                request.TeacherId,
                "Withdrawal request approved",
                $"Withdrawal confirmed and {request.Amount} EGP transferred.",
                "System",
                request.Id.ToString()
            );
            
            return Ok(new { Message = "Withdrawal approved successfully" });
        }
        catch (Exception ex)
        {
             await transaction.RollbackAsync();
             return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var request = await _context.WithdrawalRequests.FirstOrDefaultAsync(w => w.Id == id);
            if (request == null) return NotFound("Request not found");
            if (request.Status != WithdrawalStatus.Pending) return BadRequest("Request is not pending");

            // 1. Refund Funds (Return from OnHold to Balance)
            await _walletService.RefundWithdrawalAsync(request.Id.ToString());

            // 2. Update Request
            request.Status = WithdrawalStatus.Rejected;
            request.DecidedAt = DateTime.UtcNow;
            request.AdminId = adminId;
            request.RejectionReason = dto.Reason;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Notify Teacher
            await _notificationService.SendToUserAsync(
                 request.TeacherId,
                 "Withdrawal request rejected",
                 $"Sorry, your withdrawal request was rejected. Reason: {dto.Reason}",
                 "System",
                 request.Id.ToString()
             );

            return Ok(new { Message = "Withdrawal rejected and funds refunded" });
        }
        catch (Exception ex)
        {
             await transaction.RollbackAsync();
             return StatusCode(500, ex.Message);
        }
    }
}

public class WithdrawalFilterDto
{
    public WithdrawalStatus? Status { get; set; }
    public string? TeacherId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class RejectDto
{
    public string Reason { get; set; } = string.Empty;
}
