using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Services;

public interface INotificationService
{
    Task SendToUserAsync(string userId, string title, string message, string type = "System", string? relatedEntityId = null);
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendToUserAsync(string userId, string title, string message, string type = "System", string? relatedEntityId = null)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required", nameof(userId));
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title is required", nameof(title));
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message is required", nameof(message));
        if (title.Length > 200)
            throw new ArgumentException("Title must not exceed 200 characters", nameof(title));
        if (message.Length > 2000)
            throw new ArgumentException("Message must not exceed 2000 characters", nameof(message));

        try 
        {
            // 1. Save to Database
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // 2. Send Real-time via SignalR
            await _hubContext.Clients.Group(userId).SendAsync("ReceiveNotification", new
            {
                notification.Id,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.CreatedAt,
                notification.IsRead,
                notification.RelatedEntityId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification to user {UserId}", userId);
            // We don't throw here to avoid failing the main business logic (e.g. withdrawal request) just because notification failed.
        }
    }
}
