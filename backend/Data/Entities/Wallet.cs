using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class Wallet
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("User")]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal OnHoldBalance { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal PendingBalance { get; set; } = 0; // Earnings waiting for 24h

    public string Currency { get; set; } = "EGP";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<WalletTransaction> Transactions { get; set; } = new();
}
