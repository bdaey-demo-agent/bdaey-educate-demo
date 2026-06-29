using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class StudentBadge
{
    public int Id { get; set; }

    [Required]
    public string StudentId { get; set; } = string.Empty;
    
    [ForeignKey("StudentId")]
    public ApplicationUser? Student { get; set; }

    public int BadgeId { get; set; }
    
    [ForeignKey("BadgeId")]
    public Badge? Badge { get; set; }

    public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
}
