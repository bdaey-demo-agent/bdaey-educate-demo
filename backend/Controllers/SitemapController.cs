using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using System.Text;
using System.Xml;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SitemapController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string CacheKey = "SitemapXml";
    private const string BaseUrl = "https://bdaey.com";

    public SitemapController(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet]
    [Produces("application/xml")]
    public async Task<IActionResult> GetSitemap()
    {
        if (!_cache.TryGetValue(CacheKey, out string? sitemapXml))
        {
            sitemapXml = await GenerateSitemapXml();
            
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(15));
            
            _cache.Set(CacheKey, sitemapXml, cacheOptions);
        }

        return Content(sitemapXml!, "application/xml", Encoding.UTF8);
    }

    private async Task<string> GenerateSitemapXml()
    {
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        // 1. Home Page
        AddUrl(sb, "/", 1.0, "daily", DateTime.UtcNow);

        // 2. Main Public Pages
        AddUrl(sb, "/teachers-public", 0.9, "daily", DateTime.UtcNow);
        AddUrl(sb, "/how-it-works", 0.7, "weekly", DateTime.UtcNow.AddDays(-1));
        AddUrl(sb, "/how-to-use", 0.7, "weekly", DateTime.UtcNow.AddDays(-1));
        AddUrl(sb, "/contact", 0.6, "monthly", DateTime.UtcNow.AddDays(-5));
        AddUrl(sb, "/privacy", 0.4, "monthly", DateTime.UtcNow.AddDays(-10));
        AddUrl(sb, "/terms", 0.4, "monthly", DateTime.UtcNow.AddDays(-10));
        AddUrl(sb, "/student-refund-policy", 0.4, "monthly", DateTime.UtcNow.AddDays(-10));
        AddUrl(sb, "/teacher-financial-policy", 0.4, "monthly", DateTime.UtcNow.AddDays(-10));

        // 3. Approved Teacher Profiles
        var approvedTeachers = await _context.TeacherProfiles
            .Include(t => t.User)
            .Where(t => t.Status == TeacherStatus.Approved && t.User != null && !string.IsNullOrEmpty(t.User.UserName))
            .AsNoTracking()
            .Select(t => new { 
                UserName = t.User!.UserName, 
                LastModified = t.CreatedAt // Using CreatedAt as fallback for lastmod
            })
            .ToListAsync();

        foreach (var teacher in approvedTeachers)
        {
            AddUrl(sb, $"/teacher/{teacher.UserName}", 0.8, "weekly", teacher.LastModified);
        }

        sb.AppendLine("</urlset>");
        return sb.ToString();
    }

    private void AddUrl(StringBuilder sb, string path, double priority, string changefreq, DateTime lastmod)
    {
        sb.AppendLine("  <url>");
        sb.AppendLine($"    <loc>{BaseUrl}{path}</loc>");
        sb.AppendLine($"    <lastmod>{lastmod:yyyy-MM-dd}</lastmod>");
        sb.AppendLine($"    <changefreq>{changefreq}</changefreq>");
        sb.AppendLine($"    <priority>{priority:F1}</priority>");
        sb.AppendLine("  </url>");
    }
}
