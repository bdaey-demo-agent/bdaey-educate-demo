using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Services;

public class ChatCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ChatCleanupService> _logger;

    public ChatCleanupService(IServiceProvider serviceProvider, ILogger<ChatCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        _logger.LogInformation("Chat Cleanup Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupOldMessages();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing Chat Cleanup.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task CleanupOldMessages()
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var cutoffDate = DateTime.UtcNow.AddDays(-14);

            _logger.LogInformation("Cleaning up messages older than {CutoffDate} (inactive conversations).", cutoffDate);

            int totalDeleted = 0;
            const int batchSize = 50;

            while (true)
            {
                var stalePairs = await context.ChatMessages
                    .Where(m => m.SentAt < cutoffDate)
                    .GroupBy(m => new
                    {
                        P1 = m.SenderId.CompareTo(m.ReceiverId) < 0 ? m.SenderId : m.ReceiverId,
                        P2 = m.SenderId.CompareTo(m.ReceiverId) < 0 ? m.ReceiverId : m.SenderId
                    })
                    .Select(g => new
                    {
                        User1 = g.Key.P1,
                        User2 = g.Key.P2,
                        LastActivity = g.Max(m => m.SentAt)
                    })
                    .Where(x => x.LastActivity < cutoffDate)
                    .Take(batchSize)
                    .ToListAsync();

                if (stalePairs.Count == 0)
                    break;

                foreach (var pair in stalePairs)
                {
                    var deleted = await context.ChatMessages
                        .Where(m => (m.SenderId == pair.User1 && m.ReceiverId == pair.User2) ||
                                    (m.SenderId == pair.User2 && m.ReceiverId == pair.User1))
                        .ExecuteDeleteAsync();

                    totalDeleted += deleted;
                }

                _logger.LogInformation("Deleted messages from {PairCount} stale conversations this batch.", stalePairs.Count);
            }

            if (totalDeleted > 0)
            {
                _logger.LogInformation("Chat cleanup complete. Total deleted: {TotalDeleted}", totalDeleted);
            }
        }
    }
}
