using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class WalletTransaction
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Wallet")]
    public int WalletId { get; set; }
    public Wallet? Wallet { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; } // Positive for Credit, Negative for Debit

    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;

    // External Provider Details
    public string? Provider { get; set; } // e.g. "Paymob", "Fawry", "System"
    public string? ProviderTransactionId { get; set; } // External ID for Idempotency

    // Balance Snapshots for Audit
    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceBefore { get; set; }
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal BalanceAfter { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "EGP";

    public string? ReferenceId { get; set; } // Internal Reference e.g. BookingId
    public string Description { get; set; } = string.Empty;
    public string? ReturnUrl { get; set; } // Stores the URL to redirect back to after payment

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public DateTime? AvailableAt { get; set; } // When pending funds become available
}

public enum TransactionType
{
    Deposit,
    Withdrawal,
    Payment,    // Outgoing for service (Debit)
    Refund,     // Incoming from cancelled service (Credit)
    Income,     // Earnings (Credit)
    Hold,       // Funds held for potential payout (Debit)
    ReleaseHold // Funds returned from hold (Credit)
}

public enum TransactionStatus
{
    Pending,
    Succeeded,
    Failed,
    Refunded,
    Held,       // Funds are currently held
    Released,   // Hold was released (cancelled)
    PaidOut     // Held funds were successfully paid out
}
