using Microsoft.AspNetCore.Mvc;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentsController : ControllerBase
{
    private readonly IKashierPaymentService _kashierService;
    private readonly IWalletService _walletService;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        IKashierPaymentService kashierService, 
        IWalletService walletService,
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<PaymentsController> logger)
    {
        _kashierService = kashierService;
        _walletService = walletService;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpGet("kashier/callback")]
    [HttpPost("kashier/callback")]
    public async Task<IActionResult> KashierCallback()
    {
        try
        {
            var query = Request.Method == "POST" && Request.HasFormContentType ? (IQueryCollection)Request.Form : Request.Query;
            string orderId = ExtractOrderId(query);
            _logger.LogInformation("Kashier callback for OrderId: {OrderId}", orderId);

            if (!_kashierService.ValidateSignature(query))
            {
                _logger.LogWarning("Invalid Kashier signature for OrderId: {OrderId}", orderId);
                await _walletService.FailDepositAsync(orderId, null, "invalid_signature");
                return Unauthorized(new { error = "invalid_signature" });
            }

            string paymentStatus = query.ContainsKey("paymentStatus") ? query["paymentStatus"].ToString() : "UNKNOWN";
            string transactionId = query.ContainsKey("transactionId") ? query["transactionId"].ToString() : "N/A";

            if (paymentStatus != "SUCCESS")
            {
                _logger.LogWarning("Kashier payment failed for OrderId: {OrderId}, Status: {Status}", orderId, paymentStatus);
                await _walletService.FailDepositAsync(orderId, transactionId, $"payment_{paymentStatus.ToLower()}");
            }

            var allowedOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
            var frontendUrl = _configuration["FrontendUrl"] ?? "https://bdaey.com";

            string returnUrl = $"{frontendUrl}/wallet";
            if (query.ContainsKey("returnTo") && !string.IsNullOrWhiteSpace(query["returnTo"]))
            {
                var rawReturnUrl = query["returnTo"].ToString();
                if (IsAllowedRedirectUrl(rawReturnUrl, allowedOrigins, frontendUrl))
                {
                    returnUrl = rawReturnUrl;
                }
                else
                {
                    _logger.LogWarning("Blocked open redirect attempt to: {ReturnUrl}", rawReturnUrl);
                }
            }

            var pendingTx = await _context.WalletTransactions
                .FirstOrDefaultAsync(t => t.ReferenceId == orderId);

            if (pendingTx != null)
            {
                if (!string.IsNullOrEmpty(pendingTx.ReturnUrl))
                {
                    returnUrl = pendingTx.ReturnUrl;
                }
                else if (pendingTx.Description.Contains("|RETURN_URL="))
                {
                    var parts = pendingTx.Description.Split(new[] { "|RETURN_URL=" }, StringSplitOptions.None);
                    if (parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]))
                    {
                        returnUrl = parts[1].Trim();
                    }
                }
            }
            else
            {
                _logger.LogWarning("Pending transaction NOT FOUND for OrderId: {OrderId}", orderId);
            }

            if (string.IsNullOrWhiteSpace(returnUrl))
            {
                returnUrl = $"{frontendUrl}/wallet";
            }

            if (pendingTx != null && paymentStatus == "SUCCESS")
            {
                if (query.ContainsKey("amount") && query.ContainsKey("currency"))
                {
                    string callbackAmountStr = query["amount"].ToString();
                    string callbackCurrency = query["currency"].ToString();

                    if (decimal.TryParse(callbackAmountStr, out decimal callbackAmount))
                    {
                        if (callbackAmount != pendingTx.Amount || callbackCurrency != pendingTx.Currency)
                        {
                            _logger.LogWarning("Amount/currency mismatch for OrderId: {OrderId}", orderId);
                            await _walletService.FailDepositAsync(orderId, transactionId, "amount_currency_mismatch");
                            string sep = returnUrl.Contains("?") ? "&" : "?";
                            return Redirect($"{returnUrl}{sep}status=failed&reason=security_mismatch");
                        }
                    }
                }
            }

            if (paymentStatus == "SUCCESS")
            {
                try
                {
                    await _walletService.CompleteDepositAsync(orderId, transactionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to complete deposit for OrderId: {OrderId}", orderId);
                    await _walletService.FailDepositAsync(orderId, transactionId, "completion_error");
                    string sep1 = returnUrl.Contains("?") ? "&" : "?";
                    return Redirect($"{returnUrl}{sep1}status=failed&reason=invalid_order");
                }
            }
            else
            {
                string sep2 = returnUrl.Contains("?") ? "&" : "?";
                return Redirect($"{returnUrl}{sep2}status=failed&reason=payment_failed");
            }

            string separator = returnUrl.Contains("?") ? "&" : "?";
            return Redirect($"{returnUrl}{separator}status=success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kashier callback error");
            return Ok(new { error = "callback_error" });
        }
    }

    private static bool IsAllowedRedirectUrl(string url, string[] allowedOrigins, string frontendUrl)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return false;

        var origin = $"{uri.Scheme}://{uri.Host}{(uri.Port != 80 && uri.Port != 443 ? $":{uri.Port}" : "")}";

        if (allowedOrigins.Contains(origin))
            return true;

        if (origin == frontendUrl)
            return true;

        return false;
    }

    private static string ExtractOrderId(IQueryCollection query)
    {
        if (query.ContainsKey("merchantOrderId") && !string.IsNullOrWhiteSpace(query["merchantOrderId"]))
            return query["merchantOrderId"].ToString();

        if (query.ContainsKey("orderId") && !string.IsNullOrWhiteSpace(query["orderId"]))
            return query["orderId"].ToString();

        if (query.ContainsKey("merchant_order_id") && !string.IsNullOrWhiteSpace(query["merchant_order_id"]))
            return query["merchant_order_id"].ToString();

        throw new InvalidOperationException("OrderId not found in callback query parameters");
    }
}
