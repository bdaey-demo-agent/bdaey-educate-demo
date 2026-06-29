namespace BdaeyEducat.API.Settings;

public class KashierSettings
{
    public string MerchantId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://checkout.kashier.io"; // Default to production or test base
    public string Mode { get; set; } = string.Empty; // "test" or "live"
}
