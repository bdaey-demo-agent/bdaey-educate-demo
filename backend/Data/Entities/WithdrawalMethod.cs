using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class WithdrawalMethod
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Teacher")]
    public string TeacherId { get; set; } = string.Empty;
    public ApplicationUser? Teacher { get; set; }

    [MaxLength(50)]
    public string MethodType { get; set; } = string.Empty;

    [Column(TypeName = "jsonb")] 
    public string DetailsJson { get; set; } = string.Empty;

    public bool IsDefault { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? Nickname { get; set; } // e.g. "My Vodafone Wallet"
}
