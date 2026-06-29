using System.Security.Claims;
using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BdaeyEducat.API.Middleware;

public class BlockedUserMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;

    public BlockedUserMiddleware(RequestDelegate next, IMemoryCache cache)
    {
        _next = next;
        _cache = cache;
    }

    public async Task InvokeAsync(HttpContext context, IServiceScopeFactory scopeFactory)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? context.User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            await _next(context);
            return;
        }

        bool isBlocked;
        var cacheKey = $"blocked_user_{userId}";

        if (_cache.TryGetValue(cacheKey, out bool cachedBlocked))
        {
            isBlocked = cachedBlocked;
        }
        else
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                var userBlockStatus = await dbContext.Users
                    .Where(u => u.Id == userId)
                    .Select(u => new { u.IsBlocked })
                    .FirstOrDefaultAsync();

                if (userBlockStatus == null)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "AccountNotFound",
                        message = "Account not found."
                    });
                    return;
                }

                isBlocked = userBlockStatus.IsBlocked;
                _cache.Set(cacheKey, isBlocked, TimeSpan.FromSeconds(30));
            }
        }

        if (isBlocked)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                error = "AccountSuspended",
                message = "Your account has been suspended. Please contact support."
            });
            return;
        }

        await _next(context);
    }
}
