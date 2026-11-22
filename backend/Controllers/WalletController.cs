using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Dtos;
using Microsoft.AspNetCore.Identity;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IKashierPaymentService _kashierService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WalletController> _logger;

    public WalletController(
        IWalletService walletService,
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IKashierPaymentService kashierService,
        IConfiguration configuration,
        ILogger<WalletController> logger)
    {
        _walletService = walletService;
        _context = context;
        _userManager = userManager;
        _kashierService = kashierService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult> GetWallet()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var wallet = await _walletService.GetOrCreateWalletAsync(userId);
        return Ok(new
        {
            Balance = wallet.Balance,
            Currency = wallet.Currency,
            Transactions = wallet.Transactions.Select(t => new
            {
                t.Id,
                t.Amount,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                t.Description,
                t.CreatedAt
            })
        });
    }

    [HttpPost("deposit")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("deposits")]
    public async Task<IActionResult> Deposit([FromBody] DepositDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        if (dto.Amount < 10 || dto.Amount > 1_000_000)
            return BadRequest("Deposit amount must be between 10 and 1,000,000 EGP.");

        var frontendUrl = (_configuration["FrontendUrl"] ?? "https://bdaey.com").TrimEnd('/');
        var returnUrl = string.IsNullOrWhiteSpace(dto.ReturnUrl)
            ? $"{frontendUrl}/wallet"
            : dto.ReturnUrl;

        var orderId = $"DEP-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}";
        var user = await _userManager.FindByIdAsync(userId);
        var customerName = user?.FullName ?? "User";
        var customerEmail = user?.Email ?? "user@bdaey.com";

        var publicApiUrl = _configuration["PublicApiUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(publicApiUrl))
            publicApiUrl = $"{Request.Scheme}://{Request.Host}";
        var callbackUrl = $"{publicApiUrl}/api/payments/kashier/callback";

        await _walletService.InitiateDepositAsync(
            userId,
            dto.Amount,
            orderId,
            "Pending Deposit via Kashier",
            returnUrl);

        var paymentUrl = _kashierService.GeneratePaymentUrl(
            orderId,
            dto.Amount,
            "EGP",
            customerName,
            customerEmail,
            callbackUrl,
            returnUrl);

        return Ok(new { paymentUrl });
    }

    [HttpPost("redeem-promo")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> RedeemPromoCode([FromBody] PromoCodeRedeemDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(dto.Code)) return BadRequest(new { message = "Coupon code is required." });

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();
        await using var dbTransaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var promoCode = await _context.PromoCodes
                .FirstOrDefaultAsync(p => p.Code == normalizedCode);

            if (promoCode == null || !promoCode.IsActive)
                return BadRequest(new { message = "This coupon does not exist or has been disabled." });

            await _context.Database.ExecuteSqlInterpolatedAsync(
                $"SELECT 1 FROM quran.\"PromoCodes\" WHERE \"Id\" = {promoCode.Id} FOR UPDATE;");
            await _context.Entry(promoCode).ReloadAsync();

            if (!promoCode.IsActive)
                return BadRequest(new { message = "This coupon does not exist or has been disabled." });
            if (promoCode.ExpiryDate.HasValue && promoCode.ExpiryDate.Value < DateTime.UtcNow)
                return BadRequest(new { message = "This coupon has expired." });
            if (promoCode.MaxUses > 0 && promoCode.CurrentUses >= promoCode.MaxUses)
                return BadRequest(new { message = "This coupon has reached its maximum usage." });

            var alreadyUsed = await _context.PromoCodeUsages.AnyAsync(u =>
                u.PromoCodeId == promoCode.Id && u.UserId == userId);
            if (alreadyUsed)
                return BadRequest(new { message = "You have already used this coupon." });

            var startOfMonth = new DateTime(
                DateTime.UtcNow.Year,
                DateTime.UtcNow.Month,
                1,
                0,
                0,
                0,
                DateTimeKind.Utc);
            var totalRedeemedThisMonth = await _context.PromoCodeUsages
                .Where(u => u.UserId == userId && u.UsedAt >= startOfMonth)
                .SumAsync(u => u.AmountRedeemed);

            const decimal monthlyLimit = 100m;
            if (totalRedeemedThisMonth + promoCode.Amount > monthlyLimit)
            {
                return BadRequest(new
                {
                    message = $"You have exceeded the monthly coupon top-up limit. You can redeem up to {monthlyLimit} EGP per month and have already redeemed {totalRedeemedThisMonth} EGP this month."
                });
            }

            var usage = new PromoCodeUsage
            {
                PromoCodeId = promoCode.Id,
                UserId = userId,
                AmountRedeemed = promoCode.Amount,
                UsedAt = DateTime.UtcNow
            };

            _context.PromoCodeUsages.Add(usage);
            promoCode.CurrentUses += 1;
            await _context.SaveChangesAsync();

            await _walletService.ProcessTransactionAsync(
                userId,
                promoCode.Amount,
                TransactionType.Deposit,
                $"Promo Code Redeemed: {promoCode.Code}",
                referenceId: $"PROMO-{usage.Id}",
                provider: "PromoCode",
                providerTransactionId: $"promo:{promoCode.Id}:{userId}");

            await dbTransaction.CommitAsync();
            return Ok(new { message = "Wallet topped up with the coupon.", amount = promoCode.Amount });
        }
        catch (DbUpdateException ex)
        {
            await dbTransaction.RollbackAsync();
            _logger.LogWarning(ex, "Duplicate or conflicting promo redemption for user {UserId}, code {Code}", userId, normalizedCode);
            return Conflict(new { message = "This coupon was already used or a conflict occurred. Please refresh the page." });
        }
        catch (Exception ex)
        {
            await dbTransaction.RollbackAsync();
            _logger.LogError(ex, "Promo redemption failed for user {UserId}, code {Code}", userId, normalizedCode);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "The coupon cannot be redeemed right now." });
        }
    }

    [HttpGet("admin/transactions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaginatedResult<TransactionDto>>> GetAdminTransactions([FromQuery] TransactionFilterDto filter)
    {
        var result = await _walletService.GetTransactionsAsync(filter);
        return Ok(result);
    }

    [HttpGet("admin/summary")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<FinancialSummaryDto>> GetAdminSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var summary = await _walletService.GetFinancialSummaryAsync(from, to);
        return Ok(summary);
    }

    [HttpGet("admin/wallet/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> GetUserWallet(string userId)
    {
        var wallet = await _walletService.GetOrCreateWalletAsync(userId);
        return Ok(new
        {
            Balance = wallet.Balance,
            Currency = wallet.Currency,
            Transactions = wallet.Transactions.OrderByDescending(t => t.CreatedAt).Select(t => new
            {
                t.Id,
                t.Amount,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                t.Description,
                t.CreatedAt
            })
        });
    }

    [HttpPost("admin/deposit")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminDeposit([FromBody] AdminDepositDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.UserEmail);
        if (user == null) return NotFound("The specified user was not found.");

        await _walletService.ProcessTransactionAsync(
            user.Id,
            dto.Amount,
            TransactionType.Deposit,
            string.IsNullOrEmpty(dto.Description) ? "Admin Deposit" : dto.Description,
            provider: "Admin",
            providerTransactionId: Guid.NewGuid().ToString());

        return Ok(new { Message = "Funds added successfully" });
    }

    [HttpPost("admin/bulk-deposit")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminBulkDeposit([FromBody] BulkDepositDto dto)
    {
        if (dto.Amount <= 0) return BadRequest("Amount must be positive");

        List<string> userIds;
        if (dto.IsAll)
        {
            userIds = await _context.TeacherProfiles
                .Where(t => t.IsApproved && !string.IsNullOrEmpty(t.UserId))
                .Select(t => t.UserId)
                .ToListAsync();
        }
        else
        {
            if (dto.TeacherProfileIds == null || !dto.TeacherProfileIds.Any())
                return BadRequest("No teachers selected");

            userIds = await _context.TeacherProfiles
                .Where(t => dto.TeacherProfileIds.Contains(t.Id) && !string.IsNullOrEmpty(t.UserId))
                .Select(t => t.UserId)
                .ToListAsync();
        }

        if (!userIds.Any()) return BadRequest("No valid teachers found for deposit.");

        var batchId = Guid.NewGuid().ToString();
        var successCount = 0;
        foreach (var targetUserId in userIds)
        {
            try
            {
                await _walletService.ProcessTransactionAsync(
                    targetUserId,
                    dto.Amount,
                    TransactionType.Deposit,
                    string.IsNullOrEmpty(dto.Description) ? "Bulk Admin Deposit" : dto.Description,
                    referenceId: $"Bulk-{batchId}",
                    provider: "AdminBulk",
                    providerTransactionId: $"{batchId}:{targetUserId}");
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deposit for user {UserId}", targetUserId);
            }
        }

        return Ok(new
        {
            Message = $"Processed deposit for {successCount}/{userIds.Count} teachers.",
            TotalAmount = successCount * dto.Amount
        });
    }

    [HttpPost("admin/bulk-deposit-student")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminBulkDepositStudent([FromBody] BulkDepositStudentDto dto)
    {
        if (dto.Amount <= 0) return BadRequest("Amount must be positive");

        List<string> userIds;
        if (dto.IsAll)
        {
            var students = await _userManager.GetUsersInRoleAsync("Student");
            userIds = students.Select(s => s.Id).ToList();
        }
        else
        {
            if (dto.UserIds == null || !dto.UserIds.Any())
                return BadRequest("No students selected");

            userIds = await _context.Users
                .Where(u => dto.UserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();
        }

        if (!userIds.Any()) return BadRequest("No valid students found for deposit.");

        var batchId = Guid.NewGuid().ToString();
        var successCount = 0;
        foreach (var targetUserId in userIds)
        {
            try
            {
                await _walletService.ProcessTransactionAsync(
                    targetUserId,
                    dto.Amount,
                    TransactionType.Deposit,
                    string.IsNullOrEmpty(dto.Description) ? "Bulk Student Deposit" : dto.Description,
                    referenceId: $"Bulk-{batchId}",
                    provider: "AdminBulk",
                    providerTransactionId: $"{batchId}:{targetUserId}");
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deposit for user {UserId}", targetUserId);
            }
        }

        return Ok(new
        {
            Message = $"Processed deposit for {successCount}/{userIds.Count} students.",
            TotalAmount = successCount * dto.Amount
        });
    }
}
