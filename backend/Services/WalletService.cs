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
    
    // Deposit Flow (Async)
    Task<string> InitiateDepositAsync(string userId, decimal amount, string referenceId, string description, string? returnUrl = null);
    Task CompleteDepositAsync(string referenceId, string providerTransactionId);
    Task FailDepositAsync(string referenceId, string? providerTransactionId, string reason);

    // Admin Reportingt Flow (Async)
    Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterDto filter);
    Task<FinancialSummaryDto> GetFinancialSummaryAsync(DateTime? from, DateTime? to);

    // Withdrawal Logic
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
        var wallet = await _context.Wallets
            .Include(w => w.Transactions.OrderByDescending(t => t.CreatedAt).Take(50))
            .FirstOrDefaultAsync(w => w.UserId == userId);

        if (wallet == null)
        {
            wallet = new Wallet { UserId = userId };
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
        }

        return wallet;
    }

    public async Task<bool> HasSufficientFundsAsync(string userId, decimal amount)
    {
        var wallet = await GetOrCreateWalletAsync(userId);
        return wallet.Balance >= amount;
    }

    public async Task ProcessTransactionAsync(string userId, decimal amount, TransactionType type, string description, string? referenceId = null, string? provider = null, string? providerTransactionId = null)
    {
        // Idempotency Check: early exit if transaction already processed
        if (!string.IsNullOrEmpty(provider) && !string.IsNullOrEmpty(providerTransactionId))
        {
            var exists = await _context.WalletTransactions
                .AnyAsync(t => t.Provider == provider && t.ProviderTransactionId == providerTransactionId);
            
            if (exists) return; // Already processed
        }

        // Check if there is an existing transaction (e.g. from BookingsController)
        var hasActiveTransaction = _context.Database.CurrentTransaction != null;

        if (hasActiveTransaction)
        {
             // Join existing transaction scope (effectively) - just execute logic
             await ExecuteTransactionLogic(userId, amount, type, description, referenceId, provider, providerTransactionId);
        }
        else
        {
            // Start new transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await ExecuteTransactionLogic(userId, amount, type, description, referenceId, provider, providerTransactionId);
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    private async Task ExecuteTransactionLogic(string userId, decimal amount, TransactionType type, string description, string? referenceId, string? provider, string? providerTransactionId)
    {
        var wallet = await GetOrCreateWalletAsync(userId);

        // Double check funds for debit operations (Negative Amount)
        // Allow overdraft if Provider is "System" (e.g. Penalties)
        if (amount < 0 && (wallet.Balance + amount) < 0 && provider != "System")
        {
            throw new InvalidOperationException("Insufficient funds");
        }

        var balanceBefore = wallet.Balance;
        var balanceAfter = wallet.Balance + amount;

        var walletTransaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = amount,
            Type = type,
            Status = TransactionStatus.Succeeded, // Internal transactions succeed immediately
            Description = description,
            ReferenceId = referenceId,
            Provider = provider ?? "System",
            ProviderTransactionId = providerTransactionId,
            BalanceBefore = balanceBefore,
            BalanceAfter = balanceAfter,
            Currency = "EGP"
        };

        wallet.Balance = balanceAfter;
        wallet.UpdatedAt = DateTime.UtcNow;

        _context.WalletTransactions.Add(walletTransaction);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("[Wallet] Trans processed. User: {UserId}, Amount: {Amount}, NewBal: {NewBalance}", userId, amount, balanceAfter);
    
    }

    public async Task<string> InitiateDepositAsync(string userId, decimal amount, string referenceId, string description, string? returnUrl = null)
    {
        var wallet = await GetOrCreateWalletAsync(userId);

        // Check for existing pending transaction with same reference
        var exists = await _context.WalletTransactions
            .AnyAsync(t => t.ReferenceId == referenceId);
        
        if (exists) return referenceId; // Idempotency

        var transaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = amount,
            Type = TransactionType.Deposit,
            Status = TransactionStatus.Pending,
            Description = description,
            ReferenceId = referenceId,
            ReturnUrl = returnUrl, // <-- Configure ReturnUrl
            Provider = "Kashier",
            BalanceBefore = wallet.Balance,
            BalanceAfter = wallet.Balance,
            Currency = "EGP"
        };

        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();
        
        return referenceId;
    }

    public async Task CompleteDepositAsync(string referenceId, string providerTransactionId)
    {
        // 1. Find Pending Transaction
        var transaction = await _context.WalletTransactions
            .Include(t => t.Wallet)
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Status == TransactionStatus.Pending);

        if (transaction == null)
        {
            // check if already succeeded
             var completed = await _context.WalletTransactions
                .AnyAsync(t => t.ReferenceId == referenceId && t.Status == TransactionStatus.Succeeded);
             
             if (completed) return; // Already done

             throw new InvalidOperationException($"Pending transaction {referenceId} not found.");
        }

        // 2. Update Balance
        decimal oldBalance = transaction.Wallet!.Balance;
        transaction.Wallet.Balance += transaction.Amount;
        transaction.Wallet.UpdatedAt = DateTime.UtcNow;

        // 3. Update Transaction
        transaction.Status = TransactionStatus.Succeeded;
        transaction.BalanceBefore = oldBalance;
        transaction.BalanceAfter = transaction.Wallet.Balance;
        transaction.ProviderTransactionId = providerTransactionId;
        transaction.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        _logger.LogInformation("[Wallet] Deposit Completed. User: {UserId}, Amount: {Amount}, NewBal: {NewBalance}", transaction.Wallet.UserId, transaction.Amount, transaction.Wallet.Balance);
    }

    public async Task FailDepositAsync(string referenceId, string? providerTransactionId, string reason)
    {
        var tx = await _context.WalletTransactions
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Status == TransactionStatus.Pending);

        if (tx == null) return;

        tx.Status = TransactionStatus.Failed;
        tx.ProviderTransactionId = providerTransactionId;
        tx.ProcessedAt = DateTime.UtcNow;
        tx.Description = $"{tx.Description} | FAIL={reason}";

        await _context.SaveChangesAsync();
    }

    public async Task<PaginatedResult<TransactionDto>> GetTransactionsAsync(TransactionFilterDto filter)
    {
        var query = _context.WalletTransactions
            .Include(t => t.Wallet)
            .ThenInclude(w => w!.User)
            .AsNoTracking()
            .AsQueryable();

        // Filters
        if (filter.From.HasValue) 
            query = query.Where(t => t.CreatedAt >= filter.From.Value);
        
        if (filter.To.HasValue) 
            query = query.Where(t => t.CreatedAt <= filter.To.Value);
        
        if (filter.Type.HasValue) 
            query = query.Where(t => t.Type == filter.Type.Value);
        
        if (filter.Status.HasValue) 
            query = query.Where(t => t.Status == filter.Status.Value);
        
        if (!string.IsNullOrEmpty(filter.Provider)) 
            query = query.Where(t => t.Provider == filter.Provider);

        if (!string.IsNullOrEmpty(filter.SearchQuery))
        {
            var q = filter.SearchQuery.ToLower();
            query = query.Where(t => 
                t.Wallet!.User!.FullName.ToLower().Contains(q) || 
                t.Wallet!.User!.Email!.ToLower().Contains(q));
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
                    FullName = t.Wallet!.User!.FullName ?? string.Empty,
                    Email = t.Wallet!.User!.Email ?? string.Empty
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

        // Fetch needed data (Provider needed for distinction)
        // Grouping by Type AND Provider might be complex in EF translation if Provider is nullable string.
        // Let's fetch stats more granularly or use a combined Select.
        
        // We will calculate in memory after fetching grouped sums if the volume is low, 
        // OR construct 2 queries. Given it's a summary, we can do it in one pass with conditional aggregation.
        
        var summary = await query
            .GroupBy(x => 1) // Group all matching rows
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

        if (summary == null) return new FinancialSummaryDto();

        return new FinancialSummaryDto
        {
            TotalDeposits = summary.TotalDeposits,
            TotalManualDeposits = summary.TotalManualDeposits, // New Field
            TotalCouponDeposits = summary.TotalCouponDeposits, // New Field
            // TotalPayments is typically negative (deductions), Math.Abs makes it positive for reporting
            TotalPayments = Math.Abs(summary.TotalPayments),
            // TotalRefunds from DB is stored as positive amounts for refund transactions.
            // Math.Abs is not applied here because refunds are already stored as positive values.
            TotalRefunds = summary.TotalRefunds,
            PlatformProfit = summary.PlatformProfit, // New Field
            NetFlow = summary.TotalDeposits - Math.Abs(summary.TotalRefunds) // Basic flow (External In - Out)
        };
    }

    // --- Withdrawal Logic Implementation ---

    public async Task HoldFundsAsync(string userId, decimal amount, string referenceId)
    {
        var hasActiveTransaction = _context.Database.CurrentTransaction != null;

        if (hasActiveTransaction)
        {
            await ExecuteHoldFundsLogic(userId, amount, referenceId);
        }
        else
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await ExecuteHoldFundsLogic(userId, amount, referenceId);
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    private async Task ExecuteHoldFundsLogic(string userId, decimal amount, string referenceId)
    {
        var wallet = await GetOrCreateWalletAsync(userId);

        if (wallet.Balance < amount)
            throw new InvalidOperationException("Available balance is insufficient to hold funds.");

        // 1. Move funds
        wallet.Balance -= amount;
        wallet.OnHoldBalance += amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        // 2. Create Transaction (Pending Withdrawal)
        var walletTransaction = new WalletTransaction
        {
            WalletId = wallet.Id,
            Amount = -amount, // Show deduction
            Type = TransactionType.Withdrawal, // Initially marked as Withdrawal (Pending)
            Status = TransactionStatus.Pending, // Pending until admin confirmation
            Description = $"Withdrawal Request #{referenceId} (Pending)",
            ReferenceId = referenceId,
            Provider = "System",
            ProviderTransactionId = $"hold-{referenceId}",
            BalanceBefore = wallet.Balance + amount,
            BalanceAfter = wallet.Balance,
            Currency = "EGP"
        };

        _context.WalletTransactions.Add(walletTransaction);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("[Wallet] Hold processed. User: {UserId}, Amount: {Amount}, OnHold: {OnHold}", userId, amount, wallet.OnHoldBalance);
    }

    public async Task ConfirmWithdrawalAsync(string referenceId)
    {
        var hasActiveTransaction = _context.Database.CurrentTransaction != null;

        if (hasActiveTransaction)
        {
             await ExecuteConfirmWithdrawalLogic(referenceId);
        }
        else
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await ExecuteConfirmWithdrawalLogic(referenceId);
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    private async Task ExecuteConfirmWithdrawalLogic(string referenceId)
    {
        // Find the pending transaction linked to this request
        var tx = await _context.WalletTransactions
            .Include(t => t.Wallet)
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Type == TransactionType.Withdrawal && t.Status == TransactionStatus.Pending);

        if (tx == null) throw new InvalidOperationException("Pending withdrawal transaction not found.");

        // 1. Finalize Wallet State
        // Funds are already deducted from Balance and added to OnHold.
        // We just need to remove them from OnHold (they leave the system).
        tx.Wallet!.OnHoldBalance -= Math.Abs(tx.Amount);
        tx.Wallet.UpdatedAt = DateTime.UtcNow;

        // 2. Update Transaction
        tx.Status = TransactionStatus.Succeeded;
        tx.Description = tx.Description.Replace("(Pending)", "(Confirmed)");
        tx.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task RefundWithdrawalAsync(string referenceId)
    {
        var hasActiveTransaction = _context.Database.CurrentTransaction != null;

        if (hasActiveTransaction)
        {
            await ExecuteRefundWithdrawalLogic(referenceId);
        }
        else
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await ExecuteRefundWithdrawalLogic(referenceId);
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    private async Task ExecuteRefundWithdrawalLogic(string referenceId)
    {
        var tx = await _context.WalletTransactions
            .Include(t => t.Wallet)
            .FirstOrDefaultAsync(t => t.ReferenceId == referenceId && t.Type == TransactionType.Withdrawal && t.Status == TransactionStatus.Pending);

        if (tx == null) throw new InvalidOperationException("Pending withdrawal transaction not found.");

        decimal amount = Math.Abs(tx.Amount);

        // 1. Return funds
        tx.Wallet!.OnHoldBalance -= amount;
        tx.Wallet.Balance += amount;
        tx.Wallet.UpdatedAt = DateTime.UtcNow;

        // 2. Update Original Transaction to Failed/Rejected (To show it didn't go through)
        // tx.Status = TransactionStatus.Failed; // Keep as Failed or Rejected
        // Actually, let's mark it as Failed so user knows.
        tx.Status = TransactionStatus.Failed;
        tx.Description = tx.Description.Replace("(Pending)", "(Rejected)");
        tx.ProcessedAt = DateTime.UtcNow;

        // 3. Create NEW Refund Transaction (To show money coming back)
        var refundTx = new WalletTransaction
        {
            WalletId = tx.WalletId,
            Amount = amount, // Positive amount
            Type = TransactionType.Refund,
            Status = TransactionStatus.Succeeded,
            Description = $"Refund for Withdrawal #{referenceId}",
            ReferenceId = referenceId,
            Provider = "System", 
            ProviderTransactionId = $"refund-{referenceId}",
            BalanceBefore = tx.Wallet.Balance - amount,
            BalanceAfter = tx.Wallet.Balance,
            Currency = "EGP"
        };
        
        _context.WalletTransactions.Add(refundTx);

        await _context.SaveChangesAsync();
    }
}
