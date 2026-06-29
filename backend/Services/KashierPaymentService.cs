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
        string mid = _settings.MerchantId;
        string mode = _settings.Mode; 
        // Ensure amount is formatted with dot decimal separator and 2 decimal places
        string amountStr = amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
        
        // 1. Path used ONLY for Hash calculation
        // Pattern: /?payment={mid}.{orderId}.{amount}.{currency}
        string hashPath = $"/?payment={mid}.{orderId}.{amountStr}.{currency}";
        
        // 2. Generate Hash using API KEY (not SecretKey, per Kashier Hosted Checkout demo)
        string hash = GenerateHmac(hashPath, _settings.ApiKey);
        
        // If clientCallbackUrl is provided, append it to the callbackUrl as a query param
        string finalCallbackUrl = callbackUrl;
        if (!string.IsNullOrEmpty(clientCallbackUrl))
        {
            // Ensure we handle existing query params in callbackUrl if any (though usually none for base callback)
            string separator = callbackUrl.Contains("?") ? "&" : "?";
            finalCallbackUrl += $"{separator}returnTo={System.Net.WebUtility.UrlEncode(clientCallbackUrl)}";
        }

        // 3. Build Final URL (Does NOT include "payment=" in the query string)
        var qs = new List<string>
        {
            $"merchantId={mid}",
            $"orderId={orderId}",
            $"amount={amountStr}",
            $"currency={currency}",
            $"hash={hash}",
            $"mode={mode}",
            $"merchantRedirect={System.Net.WebUtility.UrlEncode(finalCallbackUrl)}", // Correct param name
            $"allowedMethods=card,wallet,bank_installments",
            $"customerName={System.Net.WebUtility.UrlEncode(customerName)}",
            $"customerEmail={System.Net.WebUtility.UrlEncode(customerEmail)}",
            $"display=ar" // Optional: set language to Arabic or English
        };

        var fullUrl = $"{_settings.BaseUrl}/?{string.Join("&", qs)}";
        
        _logger.LogDebug("Generated Kashier payment URL for order {OrderId}", orderId);

        return fullUrl;
    }

    public bool ValidateSignature(IQueryCollection query)
    {
        if (!query.ContainsKey("signature")) return false;
        
        var receivedSignature = query["signature"].ToString();
        var mode = query.ContainsKey("mode") ? query["mode"].ToString() : _settings.Mode;
        var sb = new StringBuilder();
        
        // Sort keys to ensure consistent order
        // Exclude 'signature', 'mode', and 'returnTo' (custom param not signed by Kashier)
        // NOTE: If returnTo is used in business logic (e.g. to redirect the user back),
        // it should be included in signature computation for security.
        var sortedKeys = query.Keys
            .Where(k => k != "signature" && k != "mode" && k != "returnTo") 
            .OrderBy(k => k)
            .ToList();

        for (int i = 0; i < sortedKeys.Count; i++)
        {
            var key = sortedKeys[i];
            var value = query[key].ToString();
            
            sb.Append($"{key}={value}");
            if (i < sortedKeys.Count - 1) sb.Append("&");
        }
        
        // Use SecretKey for Callback Validation (Standard Practice)
        var calculatedHash = GenerateHmac(sb.ToString(), _settings.SecretKey);
        
        if (calculatedHash != receivedSignature)
        {
            _logger.LogWarning("Kashier signature mismatch for query {QueryKeys}", string.Join(",", query.Keys));
            return false; 
        }

        _logger.LogInformation("Kashier signature validated successfully");
        return true;
    }

    private string GenerateHmac(string data, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
