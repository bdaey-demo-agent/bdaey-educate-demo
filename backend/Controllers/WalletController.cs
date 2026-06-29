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
    private readonly Microsoft.Extensions.Logging.ILogger<WalletController> _logger;

    public WalletController(IWalletService walletService, ApplicationDbContext context, UserManager<ApplicationUser> userManager, IKashierPaymentService kashierService, IConfiguration configuration, Microsoft.Extensions.Logging.ILogger<WalletController> logger)
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

        if (dto.Amount < 10) return BadRequest("Minimum deposit amount is 10 EGP.");

        // Resolve Return URL
        string returnUrl = dto.ReturnUrl ?? string.Empty;
        if (string.IsNullOrEmpty(returnUrl))
        {
            if (Request.Headers.ContainsKey("Referer"))
            {
                returnUrl = Request.Headers["Referer"].ToString();
                _logger.LogInformation("[Deposit Request] ReturnUrl missing in DTO, using Referer: {ReturnUrl}", returnUrl);
            }
            else
            {
                var frontendUrl = _configuration["FrontendUrl"] ?? "https://bdaey.com";
                returnUrl = $"{frontendUrl}/wallet"; // Final fallback
                _logger.LogInformation("[Deposit Request] ReturnUrl missing in DTO and Referer. Using default: {ReturnUrl}", returnUrl);
            }
        }
        else
        {
            _logger.LogInformation("[Deposit Request] ReturnUrl received from DTO: {ReturnUrl}", returnUrl);
        }
        
        _logger.LogInformation("[Deposit Request] User: {UserId}, Amount: {Amount}, Final ReturnUrl: {ReturnUrl}", userId, dto.Amount, returnUrl);

        // Generate Unique Order ID (short to fit gateway length limits)
        var orderId = $"DEP-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

        // We need user name/email for Kashier (optional but good for dashboard)
        var user = await _userManager.FindByIdAsync(userId);
        var customerName = user?.FullName ?? "User";
        var customerEmail = user?.Email ?? "user@bdaey.com";

        // 2. Callback URL
        var callbackUrl = $"{Request.Scheme}://{Request.Host}/api/payments/kashier/callback";

        // Store ReturnUrl in description for retrieval in callback
        string description = "Pending Deposit via Kashier";

        // 3. Save Pending Transaction 
        await _walletService.InitiateDepositAsync(
            userId, 
            dto.Amount, 
            orderId, 
            description,
            returnUrl // Pass explicity to new column
        );

        // 4. Generate URL
        var paymentUrl = _kashierService.GeneratePaymentUrl(
            orderId, 
            dto.Amount, 
            "EGP", 
            customerName, 
            customerEmail,
            callbackUrl,
            returnUrl // Pass Resolved Return URL
        );

        return Ok(new { paymentUrl });
    }



    [HttpPost("redeem-promo")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> RedeemPromoCode([FromBody] PromoCodeRedeemDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var normalizedCode = dto.Code.Trim().ToUpperInvariant();

        var promoCode = await _context.PromoCodes
            .FirstOrDefaultAsync(p => p.Code == normalizedCode && p.IsActive);

        if (promoCode == null) return BadRequest(new { message = "هذا الكوبون غير موجود أو تم إيقافه." });

        if (promoCode.ExpiryDate.HasValue && promoCode.ExpiryDate.Value < DateTime.UtcNow)
        {
            return BadRequest(new { message = "لقد انتهت صلاحية هذا الكوبون." });
        }

        if (promoCode.MaxUses > 0 && promoCode.CurrentUses >= promoCode.MaxUses)
        {
            return BadRequest(new { message = "لقد تم استخدام هذا الكوبون للحد الأقصى المسموح به." });
        }

        // Check if student already used this exact code
        bool alreadyUsed = await _context.PromoCodeUsages
            .AnyAsync(u => u.PromoCodeId == promoCode.Id && u.UserId == userId);

        if (alreadyUsed)
        {
            return BadRequest(new { message = "لقد قمت باستخدام هذا الكوبون مسبقاً." });
        }

        // Calculate total amount redeemed by this student THIS MONTH to enforce the 100 EGP limit
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var totalRedeemedThisMonth = await _context.PromoCodeUsages
            .Where(u => u.UserId == userId && u.UsedAt >= startOfMonth)
            .SumAsync(u => u.AmountRedeemed);

        var limit = 100m; // 100 EGP max per month
        if (totalRedeemedThisMonth + promoCode.Amount > limit)
        {
            return BadRequest(new { message = $"لقد تجاوزت الحد الأقصى لشحن الكوبونات شهرياً. يمكنك استرداد ما يصل إلى {limit} ج.م في الشهر. لقد استرددت بالفعل {totalRedeemedThisMonth} ج.م هذا الشهر." });
        }

        // Create usage record
        var usage = new PromoCodeUsage
        {
            PromoCodeId = promoCode.Id,
            UserId = userId,
            AmountRedeemed = promoCode.Amount,
            UsedAt = DateTime.UtcNow
        };

        _context.PromoCodeUsages.Add(usage);
        
        promoCode.CurrentUses += 1;

        await _context.SaveChangesAsync(); // Save before wallet processing to ensure usage is recorded

        // Add funds to wallet
        string description = $"Promo Code Redeemed: {promoCode.Code}";
        await _walletService.ProcessTransactionAsync(
            userId,
            promoCode.Amount,
            TransactionType.Deposit,
            description,
            referenceId: $"PROMO-{usage.Id}",
            provider: "PromoCode",
            providerTransactionId: Guid.NewGuid().ToString() // Unique idempotency key
        );

        return Ok(new { message = "تم شحن المحفظة بالكوبون بنجاح.", amount = promoCode.Amount });
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

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
                Description = t.Description,
                CreatedAt = t.CreatedAt
            })
        });
    }

    [HttpPost("admin/deposit")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminDeposit([FromBody] AdminDepositDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.UserEmail);
        if (user == null) return NotFound("The specified user was not found.");

        await _walletService.ProcessTransactionAsync(
            user.Id,
            dto.Amount,
            TransactionType.Deposit,
            string.IsNullOrEmpty(dto.Description) ? "Admin Deposit" : dto.Description,
            null, // ReferenceId
            "Admin", // Provider
            Guid.NewGuid().ToString() // ProviderTransactionId (Unique for Idempotency)
        );

        return Ok(new { Message = "Funds added successfully" });
    }

    [HttpPost("admin/bulk-deposit")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> AdminBulkDeposit([FromBody] BulkDepositDto dto)
    {
        if (dto.Amount <= 0) return BadRequest("Amount must be positive");

        List<string> userIds = new List<string>();

        if (dto.IsAll)
        {
            // Get all APPROVED teachers
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

        var batchId = Guid.NewGuid().ToString(); // Group transaction reference
        int successCount = 0;

        foreach (var userId in userIds)
        {
            try
            {
                await _walletService.ProcessTransactionAsync(
                    userId,
                    dto.Amount,
                    TransactionType.Deposit,
                    string.IsNullOrEmpty(dto.Description) ? "Bulk Admin Deposit" : dto.Description,
                    referenceId: "Bulk-" + batchId, 
                    provider: "AdminBulk", 
                    providerTransactionId: Guid.NewGuid().ToString()
                );
                successCount++;
            }
            catch (Exception ex)
            {
                // Log error but continue
                _logger.LogError(ex, "Failed to deposit for user {UserId}: {Message}", userId, ex.Message);
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

        List<string> userIds = new List<string>();

        if (dto.IsAll)
        {
            // Get all user ids in "Student" role
            var students = await _userManager.GetUsersInRoleAsync("Student");
            userIds = students.Select(s => s.Id).ToList();
        }
        else
        {
            if (dto.UserIds == null || !dto.UserIds.Any())
                return BadRequest("No students selected");

            // Verify users exist (optional: verify they are students)
            userIds = await _context.Users
                .Where(u => dto.UserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync();
        }

        if (!userIds.Any()) return BadRequest("No valid students found for deposit.");

        var batchId = Guid.NewGuid().ToString();
        int successCount = 0;

        foreach (var userId in userIds)
        {
            try
            {
                await _walletService.ProcessTransactionAsync(
                    userId,
                    dto.Amount,
                    TransactionType.Deposit,
                    string.IsNullOrEmpty(dto.Description) ? "Bulk Student Deposit" : dto.Description,
                    referenceId: "Bulk-" + batchId,
                    provider: "AdminBulk",
                    providerTransactionId: Guid.NewGuid().ToString()
                );
                successCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deposit for user {UserId}: {Message}", userId, ex.Message);
            }
        }

        return Ok(new
        {
            Message = $"Processed deposit for {successCount}/{userIds.Count} students.",
            TotalAmount = successCount * dto.Amount
        });
    }
}
