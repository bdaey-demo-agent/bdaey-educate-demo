using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Data.Entities;

public class PromoCode
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Code { get; set; } = null!;

    [Required]
    [Range(1, 1000)]
    public decimal Amount { get; set; } // The value added to the wallet

    public int MaxUses { get; set; } // Total times this code can be used
    public int CurrentUses { get; set; } = 0;

    public DateTime? ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation property
    public ICollection<PromoCodeUsage> Usages { get; set; } = new List<PromoCodeUsage>();
}
