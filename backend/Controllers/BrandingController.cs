using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BdaeyEducat.API.Controllers
{
    /// <summary>
    /// Public white-label brand identity. The frontend fetches this once at
    /// startup and themes itself (name, logo, colors) from it, so a managed
    /// per-academy deployment only sets Branding:* configuration keys.
    /// Defaults keep the current Bdaey identity.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class BrandingController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public BrandingController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [AllowAnonymous]
        [HttpGet]
        [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
        public IActionResult Get()
        {
            return Ok(new
            {
                nameAr = _configuration["Branding:NameAr"] ?? "بدائي",
                nameEn = _configuration["Branding:NameEn"] ?? "Bdaey",
                logoUrl = _configuration["Branding:LogoUrl"] ?? "/logo.png",
                faviconUrl = _configuration["Branding:FaviconUrl"] ?? "/favicon.png",
                siteUrl = _configuration["Branding:SiteUrl"] ?? "https://bdaey.com",
                twitterHandle = _configuration["Branding:Twitter"] ?? "@bdaey",
                colors = new
                {
                    primary = _configuration["Branding:Colors:Primary"] ?? "#1B5E20",
                    primaryLight = _configuration["Branding:Colors:PrimaryLight"] ?? "#2E7D32",
                    primaryLighter = _configuration["Branding:Colors:PrimaryLighter"] ?? "#4CAF50",
                    accent = _configuration["Branding:Colors:Accent"] ?? "#D4AF37",
                    accentLight = _configuration["Branding:Colors:AccentLight"] ?? "#C49F30",
                    accentLighter = _configuration["Branding:Colors:AccentLighter"] ?? "#FFE57F",
                }
            });
        }
    }
}
