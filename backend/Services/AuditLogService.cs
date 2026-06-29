using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using System.Text.Json;

namespace BdaeyEducat.API.Services;

public interface IAuditLogService
{
    Task LogAsync(string userId, string action, string targetEntity, string targetId, object? details = null, string? correlationId = null, string? ipAddress = null);
}

public class AuditLogService : IAuditLogService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(ApplicationDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(string userId, string action, string targetEntity, string targetId, object? details = null, string? correlationId = null, string? ipAddress = null)
    {
        try
        {
            var log = new AuditLog
            {
                ActorUserId = userId,
                Action = action,
                TargetEntity = targetEntity,
                TargetEntityId = targetId,
                DetailsJson = details != null ? JsonSerializer.Serialize(details) : null,
                CorrelationId = correlationId,
                IPAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Fail safe: Audit log failure should not break the main flow
            _logger.LogError(ex, "Failed to log action {Action} by user {UserId}", action, userId);
        }
    }
}
