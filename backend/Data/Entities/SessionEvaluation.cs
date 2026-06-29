using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class SessionEvaluation
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Session")]
    public int SessionId { get; set; }
    public Session? Session { get; set; }

    [ForeignKey("TeacherProfile")]
    public int TeacherProfileId { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }

    [ForeignKey("Student")]
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }

    // Memorization Tracking (Hifz)
    [MaxLength(100)]
    public string? MemorizedSurah { get; set; }
    public int? MemorizedAyahFrom { get; set; }
    public int? MemorizedAyahTo { get; set; }

    // Revision Tracking (Muraja'ah)
    [MaxLength(100)]
    public string? RevisedSurah { get; set; }
    public int? RevisedAyahFrom { get; set; }
    public int? RevisedAyahTo { get; set; }

    // Performance & Evaluation
    [Range(1, 5)]
    public int EvaluationScore { get; set; } // 1-5 stars

    [MaxLength(500)]
    public string? TeacherNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
