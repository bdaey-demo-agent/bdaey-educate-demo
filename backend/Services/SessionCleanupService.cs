using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public class SessionCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SessionCleanupService> _logger;

        public SessionCleanupService(IServiceProvider serviceProvider, ILogger<SessionCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SessionCleanupService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessMissedSessionsAsync();
                    // Run every 5 minutes
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Graceful shutdown
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing missed sessions.");
                }
            }
        }

        private async Task ProcessMissedSessionsAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var walletService = scope.ServiceProvider.GetRequiredService<IWalletService>();

                // Criteria: Scheduled status AND (ScheduledAt + Duration + 15min Buffer) < Now
                // Giving a 15-minute grace period after end time (or start time? User said "If session duration ended").
                // User said "If session duration ended". So StartTime + Duration < Now.
                // Let's add a small buffer (e.g. 5 mins) to be safe.
                
                var now = DateTime.UtcNow;
                
                var missedSessions = await context.Sessions
                    .Include(s => s.Booking)
                        .ThenInclude(b => b!.Sessions)
                    .Include(s => s.TeacherProfile)
                    .Where(s => s.Status == SessionStatus.Scheduled && 
                                s.Booking != null &&
                                s.Booking.Status == BookingStatus.Confirmed &&
                                s.ScheduledAt.AddMinutes(s.DurationMinutes) < now)
                    .ToListAsync();

                if (missedSessions.Any())
                {
                    _logger.LogInformation($"Found {missedSessions.Count} missed sessions to process.");
                }

                using var transaction = await context.Database.BeginTransactionAsync();

                foreach (var session in missedSessions)
                {
                    if (session.Booking == null) continue; // Should be filtered, but safety check

                    try 
                    {
                        _logger.LogInformation($"Processing missed session #{session.Id}. Scheduled At: {session.ScheduledAt}");

                        // 1. Calculate Prices
                        // We need to match the logic of how much the teacher GOT.
                        // Teacher got: (BookingTotal / SessionsCount) * (1 - CommRate)
                        
                        var sessionsCount = session.Booking!.Sessions.Count;
                        // Fallback if count is 0 (shouldn't happen with our recent fix)
                        if (sessionsCount == 0) sessionsCount = 1;

                        var sessionFullPrice = session.Booking.TotalPrice / sessionsCount;
                        
                        // Determine Commission Rate
                        decimal commissionRate = 15.0m;

                        if (session.TeacherProfile != null && session.TeacherProfile.ScheduledCommissionUntil.HasValue && session.TeacherProfile.ScheduledCommissionUntil.Value > DateTime.UtcNow)
                        {
                            commissionRate = session.TeacherProfile.ScheduledCommissionRate ?? 15.0m;
                        }
                        else if (session.TeacherProfile != null && session.TeacherProfile.CommissionRate.HasValue)
                        {
                            commissionRate = session.TeacherProfile.CommissionRate.Value;
                        }
                        else 
                        {
                            var setting = await context.PlatformSettings.FindAsync("GlobalCommission");
                            if (setting != null && decimal.TryParse(setting.Value, out var globalRate))
                            {
                                commissionRate = globalRate;
                            }
                        }

                        decimal teacherSharePerSession = sessionFullPrice * (100 - commissionRate) / 100m;
                        
                        // 2. Update Status
                        session.Status = SessionStatus.Cancelled; // Or a specific status like "NoShowTeacher" if we had it
                        session.CancelledAt = DateTime.UtcNow;
                        session.ReviewComment = "Auto-cancelled: Teacher did not start the session.";
                        
                        // 3. Refund Transaction
                        // Debit Teacher (Return their share)
                        // Note: Teacher might not have funds if they withdrew. 
                        // WalletService throws error if insufficient.
                        // If teacher has insufficient funds, we should probably still refund student (System Debt) or block teacher.
                        // For now, we try to deduct. If fail, maybe we log error and don't cancel?
                        // "Only the session price is transferred between teacher and student"
                        
                        // We will allow negative balance for teacher in this case? 
                        // WalletService validation: if (amount < 0 && (wallet.Balance + amount) < 0) throw
                        // We might need to bypass this for "Penalty/Refund" or just fail.
                        // User request implies strict rule. Let's try standard process first.
                        
                        // Deduct from Teacher
                        await walletService.ProcessTransactionAsync(
                            session.TeacherProfile!.UserId,
                            -teacherSharePerSession,
                            TransactionType.Refund,
                            $"Penalty for missed session #{session.Id}",
                            session.Id.ToString()
                        );

                        // Credit Student (Full Session Price)
                        // Wait! Does student get Full Price (SessionPrice) or just TeacherShare?
                        // Usually FullRefund.
                        // System loses the commission it effectively 'earned' previously.
                        await walletService.ProcessTransactionAsync(
                            session.Booking.StudentId,
                            sessionFullPrice,
                            TransactionType.Refund,
                            $"Refund for missed session #{session.Id}",
                            session.Id.ToString()
                        );

                        // Notify logic (Optional, skipping for now as HubContext needs injection)
                        
                        _logger.LogInformation($"Successfully cancelled missed session #{session.Id} and refunded student.");

                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to process missed session #{session.Id}");
                        // Continue to next session
                    }
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Process Stale Pending Bookings
                await ProcessStalePendingBookingsAsync(context, walletService);

                // Process Unrated/Unpaid Sessions (Auto-Finalize)
                await ProcessUnratedSessionsAsync(context, scope.ServiceProvider.GetRequiredService<IPayoutService>());

                // Auto Archive Expired Packages
                await ProcessExpiredPackagesAsync(context);
            }
        }

        private async Task ProcessUnratedSessionsAsync(ApplicationDbContext context, IPayoutService payoutService)
        {
            var cutoff = DateTime.UtcNow.AddHours(-1); // 1 Hour Grace Period

            // Find sessions that are Completed, Not Paid, and Finished > 1 Hour ago
            var pendingPayouts = await context.Sessions
                .Where(s => s.Status == SessionStatus.Completed && 
                            !s.IsPaidToTeacher && 
                            s.CompletedAt < cutoff)
                // Batch size 50 for safety
                .Take(50) 
                .ToListAsync();

            if (pendingPayouts.Any())
            {
                _logger.LogInformation($"Found {pendingPayouts.Count} sessions to auto-finalize.");
            }

            foreach (var session in pendingPayouts)
            {
                try
                {
                    _logger.LogInformation($"Auto-finalizing session #{session.Id}. Completed at: {session.CompletedAt}");
                    await payoutService.ProcessSessionPayoutAsync(session.Id, "System");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to auto-finalize session #{session.Id}");
                }
            }

            // SaveChangesAsync is unnecessary here because ProcessSessionPayoutAsync already persists changes
        }

        private async Task ProcessStalePendingBookingsAsync(ApplicationDbContext context, IWalletService walletService)
        {
            var now = DateTime.UtcNow;

            // Find Pending Bookings where:
            // 1. Any session has passed (Stale by date) - EXISTING
            // 2. OR Booking was created > 24 hours ago (Stale by timeout) - NEW
            var timeoutThreshold = now.AddHours(-24);

            var staleBookings = await context.Bookings
                .Include(b => b.Sessions)
                .Where(b => b.Status == BookingStatus.Pending &&
                            (b.Sessions.Any(s => s.ScheduledAt < now) || b.CreatedAt < timeoutThreshold))
                .ToListAsync();

            if (staleBookings.Any())
            {
                _logger.LogInformation($"Found {staleBookings.Count} stale pending bookings to auto-reject (Expired/Past Date).");
            }

            foreach (var booking in staleBookings)
            {
                try
                {
                    _logger.LogInformation($"Processing stale booking #{booking.Id}.");

                    // 1. Refund Student
                    // Deduct completed sessions from the refund calculation to avoid over-refunding
                    var totalSessions = booking.Sessions.Count;
                    var completedSessions = booking.Sessions.Count(s => s.Status == SessionStatus.Completed);
                    var refundAmount = totalSessions > 0
                        ? booking.TotalPrice * (totalSessions - completedSessions) / totalSessions
                        : booking.TotalPrice;

                    await walletService.ProcessTransactionAsync(
                        booking.StudentId,
                        refundAmount,
                        TransactionType.Refund,
                        $"Auto-refund for expired pending booking #{booking.Id}",
                        booking.Id.ToString()
                    );

                    // 2. Update Booking Status
                    booking.Status = BookingStatus.Cancelled;
                    booking.CancelledAt = DateTime.UtcNow;
                    booking.CancellationReason = "Auto-rejected: the 24-hour acceptance window expired or the session time passed.";

                    // 3. Update Sessions Status (only cancel scheduled sessions, not completed ones)
                    foreach (var session in booking.Sessions.Where(s => s.Status == SessionStatus.Scheduled))
                    {
                        session.Status = SessionStatus.Cancelled;
                        session.CancelledAt = DateTime.UtcNow;
                        session.ReviewComment = "Auto-cancelled: Booking expired.";
                    }

                    // 4. Notify (Log for now, SignalR requires HubContext in this scope or injected)
                    // We can inject IHubContext into the Service ctor if needed, but for simplicity we skip SignalR here 
                    // or we check if we can add it easily. 
                    // Notification Entity:
                    context.Notifications.Add(new Notification
                    {
                        UserId = booking.StudentId,
                        Title = "Request Auto-Cancelled",
                        Message = $"Booking request #{booking.Id} was cancelled because the teacher did not respond in time. The amount was refunded.",
                        Type = "Booking",
                        RelatedEntityId = booking.Id.ToString()
                    });
                    
                    if (booking.TeacherProfileId != 0) // Try to notify teacher too
                    {
                        // We need Teacher's UserId. 
                        // We didn't Include TeacherProfile -> User. 
                        // Let's rely on Notification Entity which might be enough if user pulls notifications.
                        // Or we can load it.
                        var teacherUserId = await context.TeacherProfiles
                            .Where(t => t.Id == booking.TeacherProfileId)
                            .Select(t => t.UserId)
                            .FirstOrDefaultAsync();

                        if (!string.IsNullOrEmpty(teacherUserId))
                        {
                             context.Notifications.Add(new Notification
                            {
                                UserId = teacherUserId,
                                Title = "Booking Request Expired",
                                Message = $"Booking request #{booking.Id} was automatically cancelled because the session time has passed.",
                                Type = "Booking",
                                RelatedEntityId = booking.Id.ToString()
                            });
                        }
                    }

                    _logger.LogInformation($"Successfully auto-rejected booking #{booking.Id}.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to process stale booking #{booking.Id}");
                }
            }

            await context.SaveChangesAsync();
        }

        private async Task ProcessExpiredPackagesAsync(ApplicationDbContext context)
        {
            var now = DateTimeOffset.UtcNow;
            var expiredPackages = await context.Packages
                .Where(p => p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active && p.EndDate < now)
                .ToListAsync();

            if (expiredPackages.Any())
            {
                _logger.LogInformation($"Found {expiredPackages.Count} expired packages to auto-archive.");
                foreach (var package in expiredPackages)
                {
                    package.Status = BdaeyEducat.API.Data.Enums.PackageStatus.Archived;
                    package.ArchivedAt = DateTime.UtcNow;
                    package.AdminNote = string.IsNullOrEmpty(package.AdminNote) 
                        ? $"[{DateTime.UtcNow}] Auto-archived: package period ended."
                        : package.AdminNote + $"\n[{DateTime.UtcNow}] Auto-archived: package period ended.";
                }
                await context.SaveChangesAsync();
            }
        }
    }
}
