using System.Security.Cryptography;
using System.Text;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BdaeyEducat.API.Tests;

public class KashierPaymentServiceTests
{
    private const string MerchantId = "MID-12345";
    private const string ApiKey = "test-api-key";
    private const string SecretKey = "test-secret-key";

    private static KashierPaymentService CreateService(KashierSettings? overrides = null)
    {
        var settings = overrides ?? new KashierSettings
        {
            MerchantId = MerchantId,
            ApiKey = ApiKey,
            SecretKey = SecretKey,
            BaseUrl = "https://checkout.kashier.io",
            Mode = "test"
        };
        return new KashierPaymentService(Options.Create(settings), NullLogger<KashierPaymentService>.Instance);
    }

    /// <summary>
    /// Builds the signature exactly the way Kashier documents it: every query key except
    /// signature/mode/returnTo, sorted ordinal, joined as key=value with '&', HMAC-SHA256
    /// hex (lowercase) keyed by the merchant secret.
    /// </summary>
    private static string Sign(IDictionary<string, string> query)
    {
        var sb = new StringBuilder();
        var keys = query.Keys
            .Where(k => k != "signature" && k != "mode" && k != "returnTo")
            .OrderBy(k => k, StringComparer.Ordinal)
            .ToList();
        for (var i = 0; i < keys.Count; i++)
        {
            sb.Append($"{keys[i]}={query[keys[i]]}");
            if (i < keys.Count - 1) sb.Append('&');
        }
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()))).ToLowerInvariant();
    }

    private static QueryCollection ToQuery(IDictionary<string, string> values) =>
        new(values.ToDictionary(k => k.Key, v => new Microsoft.Extensions.Primitives.StringValues(v.Value)));

    private static Dictionary<string, string> ValidCallbackParams() => new()
    {
        ["paymentStatus"] = "SUCCESS",
        ["orderId"] = "order-42",
        ["amount"] = "250.00",
        ["currency"] = "EGP",
        ["transactionId"] = "trx-999",
        ["mode"] = "test",
        ["returnTo"] = "https://bdaey.com/wallet"
    };

    [Fact]
    public void ValidateSignature_ValidSignature_ReturnsTrue()
    {
        var query = ValidCallbackParams();
        query["signature"] = Sign(query);

        Assert.True(CreateService().ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void ValidateSignature_UppercaseHexSignature_ReturnsTrue()
    {
        var query = ValidCallbackParams();
        query["signature"] = Sign(query).ToUpperInvariant();

        Assert.True(CreateService().ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void ValidateSignature_TamperedAmount_ReturnsFalse()
    {
        var query = ValidCallbackParams();
        query["signature"] = Sign(query);
        query["amount"] = "1.00"; // attacker changes the amount after signing

        Assert.False(CreateService().ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void ValidateSignature_WrongSecret_ReturnsFalse()
    {
        var query = ValidCallbackParams();
        query["signature"] = Sign(query);

        var service = CreateService(new KashierSettings
        {
            MerchantId = MerchantId,
            ApiKey = ApiKey,
            SecretKey = "other-secret",
            BaseUrl = "https://checkout.kashier.io",
            Mode = "test"
        });
        Assert.False(service.ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void ValidateSignature_MissingSignature_ReturnsFalse()
    {
        Assert.False(CreateService().ValidateSignature(ToQuery(ValidCallbackParams())));
    }

    [Theory]
    [InlineData("not-hex-at-all")]
    [InlineData("abcd")] // too short
    public void ValidateSignature_MalformedSignature_ReturnsFalse(string signature)
    {
        var query = ValidCallbackParams();
        query["signature"] = signature;

        Assert.False(CreateService().ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void ValidateSignature_EmptySecretKey_ReturnsFalse()
    {
        var query = ValidCallbackParams();
        query["signature"] = Sign(query);

        var service = CreateService(new KashierSettings
        {
            MerchantId = MerchantId,
            ApiKey = ApiKey,
            SecretKey = "",
            BaseUrl = "https://checkout.kashier.io",
            Mode = "test"
        });
        Assert.False(service.ValidateSignature(ToQuery(query)));
    }

    [Fact]
    public void GeneratePaymentUrl_ContainsValidHashAndExpectedParams()
    {
        var url = CreateService().GeneratePaymentUrl(
            "order-42", 250m, "EGP", "Yousef", "yousef@example.com",
            "https://bdaey-quran.fly.dev/api/payments/callback");

        Assert.Contains("merchantId=MID-12345", url);
        Assert.Contains("orderId=order-42", url);
        Assert.Contains("amount=250.00", url);
        Assert.Contains("currency=EGP", url);
        Assert.Contains("mode=test", url);

        // Recompute the expected checkout hash independently.
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(ApiKey));
        var expected = Convert.ToHexString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes("/?payment=MID-12345.order-42.250.00.EGP"))).ToLowerInvariant();
        Assert.Contains($"hash={expected}", url);
    }

    [Fact]
    public void GeneratePaymentUrl_MissingConfiguration_Throws()
    {
        var service = CreateService(new KashierSettings());
        Assert.Throws<InvalidOperationException>(() =>
            service.GeneratePaymentUrl("o1", 10m, "EGP", "n", "e@e.com", "https://callback"));
    }
}
