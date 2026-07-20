using Microsoft.AspNetCore.Mvc;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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
                return Unauthorized(new { error = "invalid_signature" });
            }

            string paymentStatus = query.TryGetValue("paymentStatus", out var statusValue)
                ? statusValue.ToString()
                : "UNKNOWN";
            string transactionId = query.TryGetValue("transactionId", out var transactionValue)
                ? transactionValue.ToString()
                : "N/A";

            if (!string.Equals(paymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Kashier payment failed for OrderId: {OrderId}, Status: {Status}", orderId, paymentStatus);
                await _walletService.FailDepositAsync(orderId, transactionId, $"payment_{paymentStatus.ToLowerInvariant()}");
            }

            var allowedOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
            var frontendUrl = _configuration["FrontendUrl"] ?? "https://bdaey.com";

            string returnUrl = $"{frontendUrl.TrimEnd('/')}/wallet";
            if (query.TryGetValue("returnTo", out var returnToValue) && !string.IsNullOrWhiteSpace(returnToValue))
            {
                var rawReturnUrl = returnToValue.ToString();
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
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.ReferenceId == orderId);

            if (pendingTx != null)
            {
                string? storedReturnUrl = null;
                if (!string.IsNullOrWhiteSpace(pendingTx.ReturnUrl))
                {
                    storedReturnUrl = pendingTx.ReturnUrl;
                }
                else if (pendingTx.Description.Contains("|RETURN_URL=", StringComparison.Ordinal))
                {
                    var parts = pendingTx.Description.Split(new[] { "|RETURN_URL=" }, StringSplitOptions.None);
                    if (parts.Length > 1 && !string.IsNullOrWhiteSpace(parts[1]))
                        storedReturnUrl = parts[1].Trim();
                }

                if (!string.IsNullOrWhiteSpace(storedReturnUrl))
                {
                    if (IsAllowedRedirectUrl(storedReturnUrl, allowedOrigins, frontendUrl))
                        returnUrl = storedReturnUrl;
                    else
                        _logger.LogWarning("Blocked unsafe stored return URL for OrderId {OrderId}: {ReturnUrl}", orderId, storedReturnUrl);
                }
            }
            else
            {
                _logger.LogWarning("Pending transaction NOT FOUND for OrderId: {OrderId}", orderId);
            }

            if (pendingTx != null && string.Equals(paymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                if (!query.TryGetValue("amount", out var amountValue) || !query.TryGetValue("currency", out var currencyValue))
                {
                    await _walletService.FailDepositAsync(orderId, transactionId, "missing_amount_or_currency");
                    return Redirect(AppendStatus(returnUrl, "failed", "security_mismatch"));
                }

                if (!decimal.TryParse(amountValue.ToString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var callbackAmount) ||
                    callbackAmount != pendingTx.Amount ||
                    !string.Equals(currencyValue.ToString(), pendingTx.Currency, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Amount/currency mismatch for OrderId: {OrderId}", orderId);
                    await _walletService.FailDepositAsync(orderId, transactionId, "amount_currency_mismatch");
                    return Redirect(AppendStatus(returnUrl, "failed", "security_mismatch"));
                }
            }

            if (string.Equals(paymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    await _walletService.CompleteDepositAsync(orderId, transactionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to complete deposit for OrderId: {OrderId}", orderId);
                    await _walletService.FailDepositAsync(orderId, transactionId, "completion_error");
                    return Redirect(AppendStatus(returnUrl, "failed", "invalid_order"));
                }
            }
            else
            {
                return Redirect(AppendStatus(returnUrl, "failed", "payment_failed"));
            }

            return Redirect(AppendStatus(returnUrl, "success"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kashier callback error");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "callback_error" });
        }
    }

    private static string AppendStatus(string returnUrl, string status, string? reason = null)
    {
        var separator = returnUrl.Contains('?') ? "&" : "?";
        var result = $"{returnUrl}{separator}status={Uri.EscapeDataString(status)}";
        if (!string.IsNullOrWhiteSpace(reason))
            result += $"&reason={Uri.EscapeDataString(reason)}";
        return result;
    }

    private static bool IsAllowedRedirectUrl(string url, string[] allowedOrigins, string frontendUrl)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("https" or "http"))
            return false;

        var origin = BuildOrigin(uri);

        if (allowedOrigins.Any(configured =>
                Uri.TryCreate(configured, UriKind.Absolute, out var configuredUri) &&
                string.Equals(BuildOrigin(configuredUri), origin, StringComparison.OrdinalIgnoreCase)))
            return true;

        return Uri.TryCreate(frontendUrl, UriKind.Absolute, out var frontendUri) &&
               string.Equals(BuildOrigin(frontendUri), origin, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildOrigin(Uri uri)
    {
        var isDefaultPort = (uri.Scheme == Uri.UriSchemeHttps && uri.Port == 443) ||
                            (uri.Scheme == Uri.UriSchemeHttp && uri.Port == 80);
        return $"{uri.Scheme}://{uri.Host}{(isDefaultPort ? string.Empty : $":{uri.Port}")}";
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
