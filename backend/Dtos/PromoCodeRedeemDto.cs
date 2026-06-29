using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class PromoCodeRedeemDto
{
    [Required(ErrorMessage = "Promo code is required")]
    public string Code { get; set; } = null!;
}
