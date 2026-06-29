using System;
using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class PromoCodeCreateDto
{
    [Required(ErrorMessage = "Promo code is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Code must be between 3 and 50 characters")]
    public string Code { get; set; } = null!;

    [Required(ErrorMessage = "Amount is required")]
    [Range(1, 1000, ErrorMessage = "Amount must be between 1 and 1000 EGP")]
    public decimal Amount { get; set; }

    [Required(ErrorMessage = "Max uses is required")]
    [Range(1, 10000, ErrorMessage = "Max uses must be between 1 and 10000")]
    public int MaxUses { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public bool IsActive { get; set; } = true;
}
