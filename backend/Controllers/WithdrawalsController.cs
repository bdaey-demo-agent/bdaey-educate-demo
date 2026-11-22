using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Route("api/withdrawals")]
[ApiController]
[Authorize(Roles = "Teacher")]
public class WithdrawalsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<WithdrawalsController> _logger;
    
    public WithdrawalsController(ApplicationDbContext context, IWalletService walletService, INotificationService notificationService, ILogger<WithdrawalsController> logger)
    {
        _context = context;
        _walletService = walletService;
        _notificationService = notificationService;
        _logger = logger;
    }

    // POST /api/withdrawals/request
    [HttpPost("request")]
    public async Task<IActionResult> RequestWithdrawal([FromBody] CreateWithdrawalDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        // Read minimum withdrawal amount from PlatformSettings
        var minSetting = await _context.PlatformSettings.FindAsync("MinimumWithdrawalAmount");
        decimal minWithdrawal = 500;
        if (minSetting != null && decimal.TryParse(minSetting.Value, out var parsedMin))
        {
            minWithdrawal = parsedMin;
        }

        if (dto.Amount < minWithdrawal) return BadRequest($"Minimum withdrawal amount is {minWithdrawal} EGP.");

        // 1. Check for duplicate pending requests
        var hasPending = await _context.WithdrawalRequests
            .AnyAsync(w => w.TeacherId == userId && w.Status == WithdrawalStatus.Pending);
        
        if (hasPending) 
            return BadRequest("You already have a pending withdrawal request. Please wait for it to be processed.");

        // 2. Check Balance
        if (!await _walletService.HasSufficientFundsAsync(userId!, dto.Amount))
        {
             return BadRequest("Insufficient funds.");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 3. Create Request
            var request = new WithdrawalRequest
            {
                TeacherId = userId!,
                Amount = dto.Amount,
                Status = WithdrawalStatus.Pending,
                PaymentMethod = dto.PaymentMethod,
                PaymentDetails = dto.PaymentDetails,
                SavedMethodId = dto.SavedMethodId
            };

            // 3.1 Save Method if requested
            if (dto.SaveMethod && !string.IsNullOrEmpty(dto.PaymentDetails))
            {
                 // Check for duplicate name
                 if (await _context.WithdrawalMethods.AnyAsync(m => m.TeacherId == userId && m.Nickname == dto.MethodName))
                 {
                     throw new InvalidOperationException($"You already have a saved method named '{dto.MethodName}'.");
                 }

                 var savedMethod = new WithdrawalMethod
                 {
                     TeacherId = userId!,
                     MethodType = dto.PaymentMethod,
                     DetailsJson = dto.PaymentDetails,
                     IsDefault = false,
                     CreatedAt = DateTime.UtcNow,
                     Nickname = dto.MethodName 
                 };
                 _context.WithdrawalMethods.Add(savedMethod);
            }

            _context.WithdrawalRequests.Add(request);
            await _context.SaveChangesAsync(); // Save to get ID

            // 4. Hold Funds
            await _walletService.HoldFundsAsync(userId!, dto.Amount, request.Id.ToString());

            await transaction.CommitAsync();

            // Notify Teacher
            await _notificationService.SendToUserAsync(
                userId!,
                "Withdrawal request received",
                "Your request was received. The transfer will be made within 24 hours of confirmation",
                "System",
                request.Id.ToString()
            );

            return Ok(new { Message = "Withdrawal request submitted successfully.", RequestId = request.Id });
        }
        catch (InvalidOperationException ex)
        {
             await transaction.RollbackAsync();
             return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "[Withdrawal Error]");
            return StatusCode(500, "Error submitting withdrawal request.");
        }
    }

    // GET /api/withdrawals/methods
    [HttpGet("methods")]
    public async Task<ActionResult> GetSavedMethods()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var methods = await _context.WithdrawalMethods
            .Where(m => m.TeacherId == userId)
            .OrderByDescending(m => m.IsDefault)
            .ThenByDescending(m => m.CreatedAt)
            .ToListAsync();
            
        return Ok(methods);
    }

    // POST /api/withdrawals/methods
    [HttpPost("methods")]
    public async Task<ActionResult> SaveMethod([FromBody] WithdrawalMethodDto dto)
    {
         var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
         
         // Check for duplicate name
         if (!string.IsNullOrEmpty(dto.Nickname) && await _context.WithdrawalMethods.AnyAsync(m => m.TeacherId == userId && m.Nickname == dto.Nickname))
         {
             return BadRequest($"You already have a saved method named '{dto.Nickname}'.");
         }

         var method = new WithdrawalMethod
         {
             TeacherId = userId!,
             MethodType = dto.MethodType,
             DetailsJson = dto.DetailsJson,
             IsDefault = dto.IsDefault,
             CreatedAt = DateTime.UtcNow,
             Nickname = dto.Nickname
         };

         if (dto.IsDefault)
         {
             // Unset other defaults
             var others = await _context.WithdrawalMethods.Where(m => m.TeacherId == userId && m.IsDefault).ToListAsync();
             foreach(var o in others) o.IsDefault = false;
         }

         _context.WithdrawalMethods.Add(method);
         await _context.SaveChangesAsync();

         return Ok(method);
    }

    // GET /api/withdrawals/history
    [HttpGet("history")]
    public async Task<ActionResult> GetHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requests = await _context.WithdrawalRequests
            .Where(w => w.TeacherId == userId)
            .OrderByDescending(w => w.RequestedAt)
            .ToListAsync();
            
        return Ok(requests);
    }
}

public class CreateWithdrawalDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentDetails { get; set; } = string.Empty;
    public int? SavedMethodId { get; set; }
    public bool SaveMethod { get; set; }
    public string? MethodName { get; set; }
}

public class WithdrawalMethodDto
{
    public string MethodType { get; set; } = string.Empty;
    public string DetailsJson { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public string? Nickname { get; set; }
}
