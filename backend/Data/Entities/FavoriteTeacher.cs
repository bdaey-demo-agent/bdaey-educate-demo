using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class FavoriteTeacher
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [ForeignKey(nameof(UserId))]
    public ApplicationUser User { get; set; } = null!;

    [Required]
    public int TeacherProfileId { get; set; }
    
    [ForeignKey(nameof(TeacherProfileId))]
    public TeacherProfile TeacherProfile { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
