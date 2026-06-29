using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class WithdrawalRequest
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Teacher")]
    public string TeacherId { get; set; } = string.Empty;
    public ApplicationUser? Teacher { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public WithdrawalStatus Status { get; set; } = WithdrawalStatus.Pending;

    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty;

    [Column(TypeName = "jsonb")]
    public string PaymentDetails { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DecidedAt { get; set; }

    [ForeignKey("ProcessedByAdmin")]
    public string? AdminId { get; set; }

    public ApplicationUser? ProcessedByAdmin { get; set; }

    public string? AdminNote { get; set; }
    public string? RejectionReason { get; set; }

    public int? SavedMethodId { get; set; }

    public string? ReferenceCode { get; set; }
}

public enum WithdrawalStatus
{
    Pending,
    Approved,
    Rejected
}
