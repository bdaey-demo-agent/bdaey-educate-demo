using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public class PendingEarningsReleaseService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<PendingEarningsReleaseService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

        public PendingEarningsReleaseService(IServiceProvider serviceProvider, ILogger<PendingEarningsReleaseService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("PendingEarningsReleaseService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingEarningsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing process pending earnings task.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("PendingEarningsReleaseService is stopping.");
        }

        private async Task ProcessPendingEarningsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Find all pending income transactions where the 24 hours have passed
            var readyToRelease = await context.WalletTransactions
                .Include(t => t.Wallet)
                .Where(t => t.Status == TransactionStatus.Pending 
                            && t.Type == TransactionType.Income 
                            && t.AvailableAt != null 
                            && t.AvailableAt <= DateTime.UtcNow)
                .ToListAsync(cancellationToken);

            if (!readyToRelease.Any())
            {
                return;
            }

            _logger.LogInformation($"Found {readyToRelease.Count} pending earnings ready to be released.");

            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                foreach (var tx in readyToRelease)
                {
                    if (tx.Wallet == null) continue;

                    // Move funds from PendingBalance to Balance
                    // Ensure PendingBalance doesn't go negative
                    if (tx.Wallet.PendingBalance < tx.Amount)
                    {
                        _logger.LogWarning(
                            "TX #{TxId}: Wallet {WalletId} PendingBalance ({PendingBal}) is less than release amount ({Amount}). Skipping.",
                            tx.Id, tx.Wallet.Id, tx.Wallet.PendingBalance, tx.Amount);
                        continue;
                    }

                    tx.Wallet.PendingBalance -= tx.Amount;
                    tx.Wallet.Balance += tx.Amount;
                    tx.Wallet.UpdatedAt = DateTime.UtcNow;

                    // Update Transaction Status
                    tx.Status = TransactionStatus.Succeeded;
                    tx.ProcessedAt = DateTime.UtcNow;
                    // Description can be optionally updated to remove "Pending 24H" label
                    tx.Description = tx.Description.Replace(" - Pending 24H", " - Released");

                    // Update Balance snapshots if needed
                    tx.BalanceAfter = tx.Wallet.Balance;

                    _logger.LogInformation($"Released {tx.Amount} EGP to Wallet ID {tx.Wallet.Id} for TX #{tx.Id}");
                }

                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
    }
}
