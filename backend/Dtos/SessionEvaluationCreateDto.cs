using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class SessionEvaluationCreateDto
{
    [Required]
    public int SessionId { get; set; }

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
    [Required]
    [Range(1, 5)]
    public int EvaluationScore { get; set; }

    [MaxLength(500)]
    public string? TeacherNotes { get; set; }
}
