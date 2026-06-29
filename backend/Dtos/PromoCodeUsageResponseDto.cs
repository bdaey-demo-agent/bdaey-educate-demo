using System;

namespace BdaeyEducat.API.Dtos;

public class PromoCodeUsageResponseDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public DateTime UsedAt { get; set; }
    public decimal AmountRedeemed { get; set; }
}
