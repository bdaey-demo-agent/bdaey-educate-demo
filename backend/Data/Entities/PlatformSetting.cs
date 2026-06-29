using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Data.Entities;

public class PlatformSetting
{
    [Key]
    public string Key { get; set; } = string.Empty; // e.g., "GlobalCommission"

    public string Value { get; set; } = string.Empty; // e.g., "15.0"

    public string? Description { get; set; }
}
