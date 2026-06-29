using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Data.Enums;

namespace BdaeyEducat.API.Services;

public class PackageArchiverService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PackageArchiverService> _logger;

    public PackageArchiverService(IServiceProvider serviceProvider, ILogger<PackageArchiverService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPackagesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing PackageArchiverService.");
            }

            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task ProcessPackagesAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTimeOffset.UtcNow;

        var packagesToArchive = await context.Packages
            .Where(p => p.Status == PackageStatus.Active
                        && p.EndDate <= now
                        && p.ArchivedAt == null)
            .ToListAsync();

        int archivedCount = 0;
        foreach (var package in packagesToArchive)
        {
            bool hasActiveBookings = await context.Bookings
                .AnyAsync(b => b.PackageId == package.Id
                    && b.Status == BookingStatus.Confirmed);

            if (hasActiveBookings)
            {
                _logger.LogInformation("Skipping archive for package {PackageId} with active bookings.", package.Id);
                continue;
            }

            package.ArchivedAt = DateTime.UtcNow;
            package.Status = PackageStatus.Archived;
            archivedCount++;
        }

        if (archivedCount > 0)
        {
            _logger.LogInformation("Auto-archived {Count} packages that passed their EndDate.", archivedCount);
        }

        await context.SaveChangesAsync();
    }
}
