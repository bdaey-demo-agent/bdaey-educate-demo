using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Data.Entities;

public class Badge
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    public string IconUrl { get; set; } = string.Empty;
    
    // Auto-award threshold based on points
    public int RequiredPoints { get; set; }
}
