using System.Data;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Services;

public interface IWalletService
{
    Task<Wallet> GetOrCreateWalletAsync(string userId);
    Task<bool> HasSufficientFundsAsync(string userId, decimal amount);
    Task ProcessTransactionAsync(string userId, decimal amount, TransactionType type, string description, string? referenceId = null, string? provider = null, string? providerTransactionId = null);
    Task<string> InitiateDepositAsync(string userId, decimal amount, string referenceId, string description, string? returnUrl = null);
    Task CompleteDepositAsync(string referenceId, string providerTransactionId);
    Task FailDepositAsync(string referenceId, string? providerTransactionId, string reason);
    Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterDto filter);
    Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime? from, DateTime? to);
    Task HoldFundsAsync(string userId, decimal amount, string referenceId);
    Task ConfirmWithdrawalAsync(string referenceId);
    Task RefundWithdrawalAsync(string referenceId);
}

public class WalletService : IWalletService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WalletService> _logger;

    public WalletService(ApplicationDbContext context, ILogger<WalletService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Wallet> GetOrCreateWalletAsync(string userId)
    {
        if (_context.Database.CurrentTransaction is not null)
        {
            var lockedWallet = await GetOrCreateLockedWalletAsync(userId);
            await LoadRecentTransactionsAsync(lockedWallet);
            return lockedWallet;
        }

        await using var dbTransaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        try
        {
            var wallet = await GetOrCreateLockedWalletAsync(userId);
            await LoadRecentTransactionsAsync(wallet);
            await dbTransaction.CommitAsync();
            return wallet;
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> HasSufficientFundsAsync(string userId, decimal amount)
    {
        if (amount < 0) return false;
        var balance = await _context.Wallets
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .Select(w => (decimal?)w.Balance)
            .FirstOrDefaultAsync();
        return (balance ?? 0) >= amount;
    }

    public async Task ProcessTransactionAsync(
        string userId,
        decimal amount,
        TransactionType type,
        string description,
        string? referenceId = null,
        string? provider = null,
        string? providerTransactionId = null)
    {
        if (amount == 0) throw new ArgumentOutOfRangeException(nameof(amount), "Transaction amount cannot be zero.");

        provider = string.IsNullOrWhiteSpace(provider) ? "System" : provider.Trim();
        providerTransactionId = BuildIdempotencyKey(userId, type, referenceId, providerTransactionId);

        await ExecuteWithinTransactionAsync(async () =>
        {
            var wallet = await GetOrCreateLockedWalletAsync(userId);

            if (!string.IsNullOrWhiteSpace(providerTransactionId) &&
                await _context.WalletTransactions.AnyAsync(t =>
                    t.Provider == provider && t.ProviderTransactionId == providerTransactionId))
            {
                _logger.LogInformation(
                    "Skipping duplicate wallet transaction. Provider {Provider}, TransactionId {ProviderTransactionId}",
                    provider,
                    providerTransactionId);
                return;
            }

            if (amount < 0 && wallet.Balance + amount < 0 && provider != "System")
                throw new InvalidOperationException("Insufficient funds");

            var balanceBefore = wallet.Balance;
            var balanceAfter = balanceBefore + amount;

            wallet.Balance = balanceAfter;
            wallet.UpdatedAt = DateTime.UtcNow;

            _context.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = amount,
                Type = type,
                Status = TransactionStatus.Succeeded,
                Description = description,
                ReferenceId = referenceId,
                Provider = provider,
                ProviderTransactionId = providerTransactionId,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                Currency = wallet.Currency
            });

            await _context.SaveChangesAsync();
            _logger.LogInformation(
                "Wallet transaction processed. User {UserId}, Amount {Amount}, NewBalance {NewBalance}",
                userId,
                amount,
                balanceAfter);
        });
    }

    public async Task<string> InitiateDepositAsync(
        string userId,
        decimal amount,
        string referenceId,
        string description,
        string? returnUrl = null)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        if (string.IsNullOrWhiteSpace(referenceId)) throw new ArgumentException("ReferenceId is required.", nameof(referenceId));

        await ExecuteWithinTransactionAsync(async () =>
        {
            var wallet = await GetOrCreateLockedWalletAsync(userId);

            if (await _context.WalletTransactions.AnyAsync(t => t.ReferenceId == referenceId))
                return;

            _context.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = amount,
                Type = TransactionType.Deposit,
                Status = TransactionStatus.Pending,
                Description = description,
                ReferenceId = referenceId,
                ReturnUrl = returnUrl,
                Provider = "Kashier",
                ProviderTransactionId = $"pending:{referenceId}",
                BalanceBefore = wallet.Balance,
                BalanceAfter = wallet.Balance,
                Currency = wallet.Currency
            });

            await _context.SaveChangesAsync();
        });

        return referenceId;
    }

    public async Task CompleteDepositAsync(string referenceId, string providerTransactionId)
    {
        if (string.IsNullOrWhiteSpace(providerTransactionId))
            throw new ArgumentException("Provider transaction id is required.", nameof(providerTransactionId));

        await ExecuteWithinTransactionAsync(async () =>
        {
            var deposit = await _context.WalletTransactions
                .Include(t => t.Wallet)
                .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Type == TransactionType.Deposit);

            if (deposit is null)
                throw new InvalidOperationException($"Deposit {referenceId} was not found.");

            await LockTransactionRowAsync(deposit.Id);
            await _context.Entry(deposit).ReloadAsync();

            if (deposit.Status == TransactionStatus.Succeeded) return;
            if (deposit.Status != TransactionStatus.Pending)
                throw new InvalidOperationException($"Deposit {referenceId} is not pending.");

            var wallet = await GetLockedWalletByIdAsync(deposit.WalletId);
            var duplicateProviderTransaction = await _context.WalletTransactions.AnyAsync(t =>
                t.Provider == "Kashier" &&
                t.ProviderTransactionId == providerTransactionId &&
                t.Id != deposit.Id);
            if (duplicateProviderTransaction)
                throw new InvalidOperationException("Provider transaction has already been processed.");

            var oldBalance = wallet.Balance;
            wallet.Balance += deposit.Amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            deposit.Status = TransactionStatus.Succeeded;
            deposit.BalanceBefore = oldBalance;
            deposit.BalanceAfter = wallet.Balance;
            deposit.ProviderTransactionId = providerTransactionId;
            deposit.ProcessedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation(
                "Deposit completed. User {UserId}, Amount {Amount}, NewBalance {NewBalance}",
                wallet.UserId,
                deposit.Amount,
                wallet.Balance);
        });
    }

    public async Task FailDepositAsync(string referenceId, string? providerTransactionId, string reason)
    {
        await ExecuteWithinTransactionAsync(async () =>
        {
            var deposit = await _context.WalletTransactions
                .FirstOrDefaultAsync(t =>
                    t.ReferenceId == referenceId &&
                    t.Type == TransactionType.Deposit);

            if (deposit is null) return;

            await LockTransactionRowAsync(deposit.Id);
            await _context.Entry(deposit).ReloadAsync();

            if (deposit.Status != TransactionStatus.Pending) return;

            deposit.Status = TransactionStatus.Failed;
            deposit.ProviderTransactionId = string.IsNullOrWhiteSpace(providerTransactionId)
                ? $"failed:{referenceId}"
                : providerTransactionId;
            deposit.ProcessedAt = DateTime.UtcNow;
            deposit.Description = $"{deposit.Description} | FAIL={reason}";
            await _context.SaveChangesAsync();
        });
    }

    public async Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterDto filter)
    {
        filter.Page = Math.Max(filter.Page, 1);
        filter.PageSize = Math.Clamp(filter.PageSize, 1, 200);

        var query = _context.WalletTransactions
            .AsNoTracking()
            .AsQueryable();

        if (filter.From.HasValue) query = query.Where(t => t.CreatedAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(t => t.CreatedAt <= filter.To.Value);
        if (filter.Type.HasValue) query = query.Where(t => t.Type == filter.Type.Value);
        if (filter.Status.HasValue) query = query.Where(t => t.Status == filter.Status.Value);
        if (!string.IsNullOrWhiteSpace(filter.Provider)) query = query.Where(t => t.Provider == filter.Provider);

        if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
        {
            var search = filter.SearchQuery.Trim().ToLower();
            query = query.Where(t =>
                t.Wallet!.User!.FullName.ToLower().Contains(search) ||
                t.Wallet.User.Email!.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Type = t.Type.ToString(),
                Status = t.Status.ToString(),
                Description = t.Description,
                ReferenceId = t.ReferenceId ?? string.Empty,
                CreatedAt = t.CreatedAt,
                User = new UserDto
                {
                    Id = t.Wallet!.User!.Id,
                    FullName = t.Wallet.User.FullName ?? string.Empty,
                    Email = t.Wallet.User.Email ?? string.Empty
                },
                Provider = t.Provider,
                ProviderTransactionId = t.ProviderTransactionId,
                BalanceBefore = t.BalanceBefore,
                BalanceAfter = t.BalanceAfter,
                Currency = t.Currency
            })
            .ToListAsync();

        return new PaginatedResult<TransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime? from, DateTime? to)
    {
        var query = _context.WalletTransactions
            .Where(t => t.Status == TransactionStatus.Succeeded)
            .AsNoTracking()
            .AsQueryable();

        if (from.HasValue) query = query.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(t => t.CreatedAt <= to.Value);

        var summary = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalDeposits = g.Where(t => t.Type == TransactionType.Deposit && t.Provider != "Admin" && t.Provider != "PromoCode").Sum(t => t.Amount),
                TotalManualDeposits = g.Where(t => t.Type == TransactionType.Deposit && t.Provider == "Admin").Sum(t => t.Amount),
                TotalCouponDeposits = g.Where(t => t.Type == TransactionType.Deposit && t.Provider == "PromoCode").Sum(t => t.Amount),
                TotalPayments = g.Where(t => t.Type == TransactionType.Payment).Sum(t => t.Amount),
                TotalRefunds = g.Where(t => t.Type == TransactionType.Refund).Sum(t => t.Amount),
                PlatformProfit = g.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount)
            })
            .FirstOrDefaultAsync();

        if (summary is null) return new FinancialSummaryDto();

        return new FinancialSummaryDto
        {
            TotalDeposits = summary.TotalDeposits,
            TotalManualDeposits = summary.TotalManualDeposits,
            TotalCouponDeposits = summary.TotalCouponDeposits,
            TotalPayments = Math.Abs(summary.TotalPayments),
            TotalRefunds = summary.TotalRefunds,
            PlatformProfit = summary.PlatformProfit,
            NetFlow = summary.TotalDeposits - Math.Abs(summary.TotalRefunds)
        };
    }

    public async Task HoldFundsAsync(string userId, decimal amount, string referenceId)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));

        await ExecuteWithinTransactionAsync(async () =>
        {
            var wallet = await GetOrCreateLockedWalletAsync(userId);
            var idempotencyKey = $"hold-{referenceId}";

            if (await _context.WalletTransactions.AnyAsync(t =>
                    t.Provider == "System" && t.ProviderTransactionId == idempotencyKey))
                return;

            if (wallet.Balance < amount)
                throw new InvalidOperationException("Available balance is insufficient to hold funds.");

            var balanceBefore = wallet.Balance;
            wallet.Balance -= amount;
            wallet.OnHoldBalance += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            _context.WalletTransactions.Add(new WalletTransaction
            {
                WalletId = wallet.Id,
                Amount = -amount,
                Type = TransactionType.Withdrawal,
                Status = TransactionStatus.Pending,
                Description = $"Withdrawal Request #{referenceId} (Pending)",
                ReferenceId = referenceId,
                Provider = "System",
                ProviderTransactionId = idempotencyKey,
                BalanceBefore = balanceBefore,
                BalanceAfter = wallet.Balance,
                Currency = wallet.Currency
            });

            await _context.SaveChangesAsync();
        });
    }

    public async Task ConfirmWithdrawalAsync(string referenceId)
    {
        await ExecuteWithinTransactionAsync(async () =>
        {
            var tx = await GetAndLockPendingWithdrawalAsync(referenceId);
            if (tx is null) return;

            var wallet = await GetLockedWalletByIdAsync(tx.WalletId);
            var amount = Math.Abs(tx.Amount);
            if (wallet.OnHoldBalance < amount)
                throw new InvalidOperationException("Wallet hold balance is inconsistent.");

            wallet.OnHoldBalance -= amount;
            wallet.UpdatedAt = DateTime.UtcNow;
            tx.Status = TransactionStatus.Succeeded;
            tx.Description = tx.Description.Replace("(Pending)", "(Confirmed)");
            tx.ProcessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        });
    }

    public async Task RefundWithdrawalAsync(string referenceId)
    {
        await ExecuteWithinTransactionAsync(async () =>
        {
            var tx = await GetAndLockPendingWithdrawalAsync(referenceId);
            if (tx is null) return;

            var wallet = await GetLockedWalletByIdAsync(tx.WalletId);
            var amount = Math.Abs(tx.Amount);
            if (wallet.OnHoldBalance < amount)
                throw new InvalidOperationException("Wallet hold balance is inconsistent.");

            var balanceBefore = wallet.Balance;
            wallet.OnHoldBalance -= amount;
            wallet.Balance += amount;
            wallet.UpdatedAt = DateTime.UtcNow;

            tx.Status = TransactionStatus.Failed;
            tx.Description = tx.Description.Replace("(Pending)", "(Rejected)");
            tx.ProcessedAt = DateTime.UtcNow;

            var refundId = $"refund-{referenceId}";
            if (!await _context.WalletTransactions.AnyAsync(t =>
                    t.Provider == "System" && t.ProviderTransactionId == refundId))
            {
                _context.WalletTransactions.Add(new WalletTransaction
                {
                    WalletId = wallet.Id,
                    Amount = amount,
                    Type = TransactionType.Refund,
                    Status = TransactionStatus.Succeeded,
                    Description = $"Refund for Withdrawal #{referenceId}",
                    ReferenceId = referenceId,
                    Provider = "System",
                    ProviderTransactionId = refundId,
                    BalanceBefore = balanceBefore,
                    BalanceAfter = wallet.Balance,
                    Currency = wallet.Currency
                });
            }

            await _context.SaveChangesAsync();
        });
    }

    private async Task ExecuteWithinTransactionAsync(Func<Task> operation)
    {
        if (_context.Database.CurrentTransaction is not null)
        {
            await operation();
            return;
        }

        await using var dbTransaction = await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
        try
        {
            await operation();
            await dbTransaction.CommitAsync();
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }

    private async Task<Wallet> GetOrCreateLockedWalletAsync(string userId)
    {
        if (_context.Database.CurrentTransaction is null)
            throw new InvalidOperationException("A database transaction is required before locking a wallet.");

        // Transaction-scoped advisory lock serializes first-time wallet creation per user.
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtext({userId}));");

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet is null)
        {
            wallet = new Wallet { UserId = userId };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        await LockWalletRowAsync(wallet.Id);
        await _context.Entry(wallet).ReloadAsync();
        return wallet;
    }

    private async Task<Wallet> GetLockedWalletByIdAsync(int walletId)
    {
        await LockWalletRowAsync(walletId);
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.Id == walletId);
        return wallet ?? throw new InvalidOperationException("Wallet not found.");
    }

    private async Task LockWalletRowAsync(int walletId)
    {
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM quran.\"Wallets\" WHERE \"Id\" = {walletId} FOR UPDATE;");
    }

    private async Task LockTransactionRowAsync(int transactionId)
    {
        await _context.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT 1 FROM quran.\"WalletTransactions\" WHERE \"Id\" = {transactionId} FOR UPDATE;");
    }

    private async Task<WalletTransaction?> GetAndLockPendingWithdrawalAsync(string referenceId)
    {
        var tx = await _context.WalletTransactions.FirstOrDefaultAsync(t =>
            t.ReferenceId == referenceId &&
            t.Type == TransactionType.Withdrawal);

        if (tx is null) return null;

        await LockTransactionRowAsync(tx.Id);
        await _context.Entry(tx).ReloadAsync();
        return tx.Status == TransactionStatus.Pending ? tx : null;
    }

    private async Task LoadRecentTransactionsAsync(Wallet wallet)
    {
        await _context.Entry(wallet)
            .Collection(w => w.Transactions)
            .Query()
            .OrderByDescending(t => t.CreatedAt)
            .Take(50)
            .LoadAsync();
    }

    private static string? BuildIdempotencyKey(
        string userId,
        TransactionType type,
        string? referenceId,
        string? providerTransactionId)
    {
        if (!string.IsNullOrWhiteSpace(providerTransactionId))
            return providerTransactionId.Trim();

        if (string.IsNullOrWhiteSpace(referenceId))
            return null;

        return $"{type}:{referenceId}:{userId}";
    }
}
