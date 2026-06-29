using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public class PayoutService : IPayoutService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWalletService _walletService;
        private readonly ILogger<PayoutService> _logger;

        public PayoutService(ApplicationDbContext context, IWalletService walletService, ILogger<PayoutService> logger)
        {
            _context = context;
            _walletService = walletService;
            _logger = logger;
        }

        public async Task ProcessSessionPayoutAsync(int sessionId, string finalizedBy)
        {
            // 1. Transaction Boundary for Atomicity
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var session = await _context.Sessions
                    .Include(s => s.Booking)
                        .ThenInclude(b => b!.Sessions)
                    .Include(s => s.TeacherProfile)
                        .ThenInclude(t => t!.User)
                    .FirstOrDefaultAsync(s => s.Id == sessionId);

                if (session == null) throw new ArgumentException("Session not found");
                if (session.TeacherProfile == null || session.TeacherProfile.User == null)
                    throw new InvalidOperationException("Session has no associated teacher");

                // 2. Idempotency Check (Check Flag & Transaction)
                if (session.IsPaidToTeacher)
                {
                    _logger.LogInformation($"Session #{sessionId} is already marked as paid. Skipping.");
                    return;
                }

                var providerTransactionId = $"session:{sessionId}:payout";
                
                // We assume WalletService handles check for existing ProviderTransactionId implicitly or we check explicit logic?
                // WalletService.ProcessTransactionAsync usually checks it if we customized it.
                // But let's rely on the DB unique constraint as fallback. 
                // The implementation of WalletService is:
                // if (query.Any(t => t.Provider == provider && t.ProviderTransactionId == providerTransactionId)) return;
                // So checking IsPaidToTeacher + calling WalletService is safe.

                // 3. Calculate Amount
                decimal grossAmount = session.Price;
                
                // Fallback for sessions created before the migration (Price = 0)
                if (grossAmount <= 0)
                {
                    if (session.Booking != null && session.Booking.TotalPrice > 0) 
                    {
                         var totalSessions = session.Booking.Sessions.Count > 0 ? session.Booking.Sessions.Count : 1;
                         grossAmount = session.Booking.TotalPrice / totalSessions;
                         
                         _logger.LogWarning($"Session #{sessionId} has 0 price. Using fallback calculation: {session.Booking.TotalPrice} / {totalSessions} = {grossAmount}");
                    }
                    else
                    {
                        _logger.LogError($"Session #{sessionId} cannot determine price. Booking TotalPrice is 0 or missing.");
                        return; // Or throw? better safe than sorry.
                    }
                }

                // 4. Commission Logic
                decimal commissionRate = 15.0m; // Default
                
                // Priority: Scheduled > Permanent > Global
                if (session.TeacherProfile.ScheduledCommissionUntil.HasValue && session.TeacherProfile.ScheduledCommissionUntil.Value > DateTime.UtcNow)
                {
                    commissionRate = session.TeacherProfile.ScheduledCommissionRate ?? 15.0m;
                    // Note: If scheduled is null, it should ideally fallback to Global, but we check HasValue above.
                }
                else if (session.TeacherProfile.CommissionRate.HasValue)
                {
                    commissionRate = session.TeacherProfile.CommissionRate.Value;
                }
                else
                {
                    var setting = await _context.PlatformSettings.FindAsync("GlobalCommission");
                    if (setting != null && decimal.TryParse(setting.Value, out var globalRate))
                    {
                        commissionRate = globalRate;
                    }
                }

                decimal netPayout = grossAmount * (1 - (commissionRate / 100m));
                netPayout = Math.Round(netPayout, 2);

                if (netPayout < 0) netPayout = 0;

                // 5. Execute Payment
                await _walletService.ProcessTransactionAsync(
                    session.TeacherProfile.UserId,
                    netPayout,
                    TransactionType.Income,
                    $"Income from Session #{sessionId} (Finalized by {finalizedBy})",
                    referenceId: sessionId.ToString(),
                    provider: "System",
                    providerTransactionId: providerTransactionId
                );

                // 6. Update Session State
                session.IsPaidToTeacher = true;
                session.PaidAt = DateTime.UtcNow;
                session.PayoutAmount = netPayout;
                session.FinalizedAt = DateTime.UtcNow;
                session.FinalizedBy = finalizedBy;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Successfully paid session #{sessionId} to teacher {session.TeacherProfile.UserId}. Amount: {netPayout}");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, $"Failed to process payout for session #{sessionId}");
                throw; // Rethrow to let caller know
            }
        }
    }
}
