using System;

namespace BdaeyEducat.API.Dtos;

public class PromoCodeResponseDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public decimal Amount { get; set; }
    public int MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public ICollection<PromoCodeUsageResponseDto> Usages { get; set; } = new List<PromoCodeUsageResponseDto>();
}
