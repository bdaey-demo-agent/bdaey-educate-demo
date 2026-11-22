using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Route("api/admin/wallet")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminWalletController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;
    private readonly IAuditLogService _auditLogService;
    // Notification Service implied via Hub or Email Service - for simplicity using simplified notification here or will add service if needed.
    // Assuming Hub is needed.
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> _hubContext;
    private readonly ILogger<AdminWalletController> _logger;

    public AdminWalletController(ApplicationDbContext context, IWalletService walletService, IAuditLogService auditLogService, Microsoft.AspNetCore.SignalR.IHubContext<BdaeyEducat.API.Hubs.NotificationHub> hubContext, ILogger<AdminWalletController> logger)
    {
        _context = context;
        _walletService = walletService;
        _auditLogService = auditLogService;
        _hubContext = hubContext;
        _logger = logger;
    }

    // GET /api/admin/wallet/withdrawals
    [HttpGet("withdrawals")]
    public async Task<ActionResult> GetWithdrawals([FromQuery] string? status)
    {
        var query = _context.WithdrawalRequests
            .Include(w => w.Teacher)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<WithdrawalStatus>(status, true, out var st))
        {
            query = query.Where(w => w.Status == st);
        }

        var requests = await query
            .OrderByDescending(w => w.RequestedAt)
            .Select(w => new 
            {
                w.Id,
                TeacherId = w.TeacherId,
                TeacherName = w.Teacher != null ? w.Teacher.FullName : "Unknown",
                w.Amount,
                Status = w.Status.ToString(),
                w.PaymentMethod,
                w.PaymentDetails,
                w.RequestedAt,
                w.ReferenceCode,
                w.AdminNote,
                w.RejectionReason
            })
            .ToListAsync();

        return Ok(requests);
    }

    public class ProcessWithdrawalDto
    {
        public string Action { get; set; } = string.Empty; // "Approve" or "Reject"
        public string? Note { get; set; }
        public string? ReferenceCode { get; set; } // Required if Approve
        public string? RejectionReason { get; set; } // Required if Reject
    }

    // PUT /api/admin/wallet/withdrawals/{id}/process
    [HttpPut("withdrawals/{id}/process")]
    public async Task<IActionResult> ProcessWithdrawal(int id, [FromBody] ProcessWithdrawalDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var correlationId = Guid.NewGuid().ToString();

        // 1. Validations
        if (dto.Action != "Approve" && dto.Action != "Reject") return BadRequest("Invalid action.");
        if (dto.Action == "Approve" && string.IsNullOrEmpty(dto.ReferenceCode)) return BadRequest("Reference code is required for approval.");
        if (dto.Action == "Reject" && string.IsNullOrEmpty(dto.RejectionReason)) return BadRequest("Rejection reason is required.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var request = await _context.WithdrawalRequests
                .FirstOrDefaultAsync(w => w.Id == id);
            
            if (request == null) return NotFound();
            
            // No double processing / Double approve check
            if (request.Status != WithdrawalStatus.Pending) 
                return BadRequest($"Request is already {request.Status}.");

            // Find valid Hold transaction
             var holdTx = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.Type == TransactionType.Hold && t.ReferenceId == request.Id.ToString());

            if (holdTx == null) 
            {
                 // Critical consistency check
                 return BadRequest("Critical: Linked Hold transaction not found. Cannot process.");
            }

            // Ensure Hold is actually in Held status (double check)
            if (holdTx.Status != TransactionStatus.Held)
                 return BadRequest($"Linked transaction status is {holdTx.Status}, expected Held.");

            if (dto.Action == "Approve")
            {
                // Action: Review Request -> Approve -> PaidOut
                request.Status = WithdrawalStatus.Approved;
                request.DecidedAt = DateTime.UtcNow;
                request.ReferenceCode = dto.ReferenceCode;
                request.AdminId = adminId;
                request.AdminNote = dto.Note;

                holdTx.Status = TransactionStatus.PaidOut;
                holdTx.ProcessedAt = DateTime.UtcNow;
                holdTx.ReferenceId = dto.ReferenceCode; // Update Ref from internal to External? OR keep internal link.
                // Better keep ReferenceId as Internal Link (RequestId), and maybe use ProviderTransactionId for External?
                if (string.IsNullOrEmpty(holdTx.ProviderTransactionId))
                     holdTx.ProviderTransactionId = dto.ReferenceCode;
                
                holdTx.Description += $" [Approved Ref: {dto.ReferenceCode}]";
            }
            else // Reject
            {
                // Action: Review -> Reject -> Release Hold
                request.Status = WithdrawalStatus.Rejected;
                request.DecidedAt = DateTime.UtcNow;
                request.AdminId = adminId;
                request.RejectionReason = dto.RejectionReason;
                request.AdminNote = dto.Note;

                holdTx.Status = TransactionStatus.Released;
                holdTx.ProcessedAt = DateTime.UtcNow;

                // Refund the held amount (Release Hold)
                // Hold was Debit (-500). Release should be Credit (+500).
                await _walletService.ProcessTransactionAsync(
                    request.TeacherId,
                    request.Amount,
                    TransactionType.ReleaseHold,
                    $"Withdrawal Rejected: {dto.RejectionReason}",
                    referenceId: request.Id.ToString(),
                    provider: "System",
                    providerTransactionId: correlationId // specific release tx id
                );
            }

            await _context.SaveChangesAsync();
            await _auditLogService.LogAsync(adminId!, "ProcessWithdrawal", "WithdrawalRequest", id.ToString(), dto, correlationId);

            await transaction.CommitAsync();

            // Post-Commit Notification
            var msg = dto.Action == "Approve" 
                ? $"Withdrawal request #{id} approved. Reference: {dto.ReferenceCode}"
                : $"Withdrawal request #{id} rejected. Reason: {dto.RejectionReason}";
            
            await _hubContext.Clients.Group(request.TeacherId).SendAsync("ReceiveNotification", msg);

             _context.Notifications.Add(new Notification
            {
                 UserId = request.TeacherId,
                 Title = "Withdrawal Request Update",
                 Message = msg,
                 Type = "Wallet",
                 RelatedEntityId = request.Id.ToString()
            });
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Request {dto.Action}d successfully." });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "[ProcessWithdrawal] Error");
            return StatusCode(500, "Error processing withdrawal.");
        }
    }
}
