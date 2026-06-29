using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BdaeyEducat.API.Middleware
{
    public class TenantMigrationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly ILogger<TenantMigrationMiddleware> _logger;
        private readonly string[] _excludedSubdomains;

        public TenantMigrationMiddleware(RequestDelegate next, IMemoryCache cache, IConfiguration configuration, ILogger<TenantMigrationMiddleware> logger)
        {
            _next = next;
            _cache = cache;
            _logger = logger;
            _excludedSubdomains = configuration.GetSection("TenantExclusions:Subdomains")
                .Get<string[]>() ?? new[] { "www", "admin", "api", "quran", "bdaey-lms-api", "localhost" };
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Items.ContainsKey("TenantNotFound"))
            {
                string? dbgSubdomain = null;
                var requestHost = context.Request.Host.Host;
                if (!string.IsNullOrEmpty(requestHost))
                {
                    var hostParts = requestHost.Split('.');
                    if (hostParts.Length > 2) dbgSubdomain = hostParts[0];
                    else if (hostParts.Length == 2 && requestHost.Contains("localhost")) dbgSubdomain = hostParts[0];
                }
                if (string.IsNullOrEmpty(dbgSubdomain) && context.Request.Headers.TryGetValue("X-Tenant-Subdomain", out var dbgHeaderVal))
                    dbgSubdomain = dbgHeaderVal.ToString();

                _logger.LogInformation("Blocked request for non-existent/deleted tenant subdomain: '{Subdomain}'", dbgSubdomain);

                var origin = context.Request.Headers["Origin"].ToString();
                if (!string.IsNullOrEmpty(origin))
                {
                    context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                    context.Response.Headers["Access-Control-Allow-Headers"] = "*";
                    context.Response.Headers["Access-Control-Allow-Methods"] = "*";
                    context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                }
                else
                {
                    context.Response.Headers["Access-Control-Allow-Origin"] = "*";
                }

                context.Response.StatusCode = 404;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Tenant not found or subscription is inactive." });
                return;
            }

            string? subdomain = null;
            var host = context.Request.Host.Host;
            if (!string.IsNullOrEmpty(host))
            {
                var parts = host.Split('.');
                if (parts.Length > 2)
                {
                    subdomain = parts[0];
                }
                else if (parts.Length == 2 && host.Contains("localhost"))
                {
                    subdomain = parts[0];
                }
            }

            if (string.IsNullOrEmpty(subdomain) && context.Request.Headers.TryGetValue("X-Tenant-Subdomain", out var headerVal))
            {
                subdomain = headerVal.ToString();
            }

            if (!string.IsNullOrEmpty(subdomain))
            {
                var normalized = subdomain.ToLowerInvariant().Trim();
                if (!Array.Exists(_excludedSubdomains, s => s.Equals(normalized, StringComparison.OrdinalIgnoreCase)))
                {
                    var cacheKey = $"tenant_activity_{normalized}";
                    if (!_cache.TryGetValue(cacheKey, out _))
                    {
                        _logger.LogDebug("Tenant activity detected for subdomain: '{Subdomain}'", normalized);
                        _cache.Set(cacheKey, true, new MemoryCacheEntryOptions
                        {
                            SlidingExpiration = TimeSpan.FromMinutes(5)
                        });
                    }
                }
            }

            await _next(context);
        }
    }
}
