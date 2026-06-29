using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;
using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BdaeyEducat.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    private static readonly ConcurrentDictionary<string, int> _userConnections = new();

    public static int GetActiveUsersCount() => _userConnections.Count;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(IServiceScopeFactory scopeFactory, ILogger<NotificationHub> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);

            int newCount = _userConnections.AddOrUpdate(userId, 1, (key, count) => count + 1);

            if (newCount == 1)
            {
                await UpdateTeacherOnlineStatus(userId, true);
            }
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            if (_userConnections.TryGetValue(userId, out int currentCount))
            {
                int newCount = currentCount - 1;
                if (newCount <= 0)
                {
                    _userConnections.TryRemove(userId, out _);
                    await UpdateTeacherOnlineStatus(userId, false);
                }
                else
                {
                    _userConnections.TryUpdate(userId, newCount, currentCount);
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private async Task UpdateTeacherOnlineStatus(string userId, bool isOnline)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cache = scope.ServiceProvider.GetRequiredService<IMemoryCache>();

            var teacherProfile = await context.TeacherProfiles
                .FirstOrDefaultAsync(t => t.UserId == userId);

            if (teacherProfile != null && teacherProfile.IsOnline != isOnline)
            {
                teacherProfile.IsOnline = isOnline;
                await context.SaveChangesAsync();
                cache.Remove("ApprovedTeachersList");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update IsOnline for user {UserId}", userId);
        }
    }
}
