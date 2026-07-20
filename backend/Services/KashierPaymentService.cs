using System.Security.Cryptography;
using System.Text;
using BdaeyEducat.API.Settings;
using Microsoft.Extensions.Options;

namespace BdaeyEducat.API.Services;

public interface IKashierPaymentService
{
    string GeneratePaymentUrl(string orderId, decimal amount, string currency, string customerName, string customerEmail, string callbackUrl, string? clientCallbackUrl = null);
    bool ValidateSignature(IQueryCollection query);
}

public class KashierPaymentService : IKashierPaymentService
{
    private readonly KashierSettings _settings;
    private readonly ILogger<KashierPaymentService> _logger;

    public KashierPaymentService(IOptions<KashierSettings> settings, ILogger<KashierPaymentService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public string GeneratePaymentUrl(string orderId, decimal amount, string currency, string customerName, string customerEmail, string callbackUrl, string? clientCallbackUrl = null)
    {
        EnsureCheckoutConfiguration();

        string mid = _settings.MerchantId;
        string mode = _settings.Mode;
        string amountStr = amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);

        string hashPath = $"/?payment={mid}.{orderId}.{amountStr}.{currency}";
        string hash = GenerateHmac(hashPath, _settings.ApiKey);

        string finalCallbackUrl = callbackUrl;
        if (!string.IsNullOrEmpty(clientCallbackUrl))
        {
            string separator = callbackUrl.Contains('?') ? "&" : "?";
            finalCallbackUrl += $"{separator}returnTo={System.Net.WebUtility.UrlEncode(clientCallbackUrl)}";
        }

        var qs = new List<string>
        {
            $"merchantId={mid}",
            $"orderId={orderId}",
            $"amount={amountStr}",
            $"currency={currency}",
            $"hash={hash}",
            $"mode={mode}",
            $"merchantRedirect={System.Net.WebUtility.UrlEncode(finalCallbackUrl)}",
            "allowedMethods=card,wallet,bank_installments",
            $"customerName={System.Net.WebUtility.UrlEncode(customerName)}",
            $"customerEmail={System.Net.WebUtility.UrlEncode(customerEmail)}",
            "display=ar"
        };

        var fullUrl = $"{_settings.BaseUrl.TrimEnd('/')}/?{string.Join("&", qs)}";
        _logger.LogDebug("Generated Kashier payment URL for order {OrderId}", orderId);
        return fullUrl;
    }

    public bool ValidateSignature(IQueryCollection query)
    {
        if (string.IsNullOrWhiteSpace(_settings.SecretKey) || !query.TryGetValue("signature", out var signatureValue))
            return false;

        var receivedSignature = signatureValue.ToString().Trim().ToLowerInvariant();
        if (receivedSignature.Length != 64 || receivedSignature.Any(c => !Uri.IsHexDigit(c)))
            return false;

        var sb = new StringBuilder();
        var sortedKeys = query.Keys
            .Where(k => k != "signature" && k != "mode" && k != "returnTo")
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToList();

        for (int i = 0; i < sortedKeys.Count; i++)
        {
            var key = sortedKeys[i];
            sb.Append($"{key}={query[key]}");
            if (i < sortedKeys.Count - 1) sb.Append('&');
        }

        var calculatedHash = GenerateHmac(sb.ToString(), _settings.SecretKey);
        var calculatedBytes = Convert.FromHexString(calculatedHash);
        var receivedBytes = Convert.FromHexString(receivedSignature);
        var isValid = CryptographicOperations.FixedTimeEquals(calculatedBytes, receivedBytes);

        if (!isValid)
        {
            _logger.LogWarning("Kashier signature mismatch for query keys {QueryKeys}", string.Join(',', query.Keys));
            return false;
        }

        _logger.LogInformation("Kashier signature validated successfully");
        return true;
    }

    private void EnsureCheckoutConfiguration()
    {
        if (string.IsNullOrWhiteSpace(_settings.MerchantId) ||
            string.IsNullOrWhiteSpace(_settings.ApiKey) ||
            string.IsNullOrWhiteSpace(_settings.BaseUrl))
        {
            throw new InvalidOperationException("Kashier checkout is not configured.");
        }
    }

    private static string GenerateHmac(string data, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
