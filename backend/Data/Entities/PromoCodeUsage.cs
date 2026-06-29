using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class PromoCodeUsage
{
    public int Id { get; set; }

    [Required]
    public int PromoCodeId { get; set; }
    public PromoCode PromoCode { get; set; } = null!;

    [Required]
    public string UserId { get; set; } = null!; // The Student User ID
    [ForeignKey("UserId")]
    public ApplicationUser User { get; set; } = null!;

    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    public decimal AmountRedeemed { get; set; }
}
