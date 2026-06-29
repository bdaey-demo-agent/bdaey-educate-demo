namespace BdaeyEducat.API.Dtos;

public class SessionEvaluationResponseDto
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int TeacherProfileId { get; set; }
    public string StudentId { get; set; } = string.Empty;

    // Additional info for display
    public string TeacherName { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;

    // Memorization Tracking (Hifz)
    public string? MemorizedSurah { get; set; }
    public int? MemorizedAyahFrom { get; set; }
    public int? MemorizedAyahTo { get; set; }

    // Revision Tracking (Muraja'ah)
    public string? RevisedSurah { get; set; }
    public int? RevisedAyahFrom { get; set; }
    public int? RevisedAyahTo { get; set; }

    public int EvaluationScore { get; set; }
    public string? TeacherNotes { get; set; }

    public DateTime CreatedAt { get; set; }
}
