using System.ComponentModel.DataAnnotations;
using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Dtos;

public class TransactionFilterDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public TransactionType? Type { get; set; }
    public TransactionStatus? Status { get; set; }
    public string? SearchQuery { get; set; }
    public string? Provider { get; set; }
}

public class PaginatedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class TransactionDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // User Details
    public UserDto User { get; set; } = new();

    // Provider Details
    public string? Provider { get; set; }
    public string? ProviderTransactionId { get; set; }

    // Audit
    public decimal BalanceBefore { get; set; }
    public decimal BalanceAfter { get; set; }
    public string Currency { get; set; } = "EGP";
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class FinancialSummaryDto
{
    public decimal TotalDeposits { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal TotalRefunds { get; set; }
    public decimal NetFlow { get; set; }
    public decimal TotalManualDeposits { get; set; }
    public decimal TotalCouponDeposits { get; set; }
    public decimal PlatformProfit { get; set; }
}

public class AdminDepositDto
{
    [Required]
    [EmailAddress]
    public string UserEmail { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
}

public class DepositDto
{
    public decimal Amount { get; set; }
    public string? ReturnUrl { get; set; }
}
