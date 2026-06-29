namespace BdaeyEducat.API.Dtos;

public class SessionDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int TeacherProfileId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public DateTimeOffset ScheduledAt { get; set; }
    public string TimezoneId { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BookingStatus { get; set; } = string.Empty;
    public string? RoomUrl { get; set; }
    public string? RecordingUrl { get; set; }
    public int? Rating { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public bool HasEvaluation { get; set; }
}

public class UpdateSessionDto
{
    public string? Status { get; set; } // Scheduled, InProgress, Completed, Cancelled, NoShow
    public string? RoomUrl { get; set; }
    public string? RecordingUrl { get; set; }
    public DateTimeOffset? RescheduledAt { get; set; } // Optional: to reschedule
}

public class UpdateSessionStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class UpdateSessionLinkDto
{
    public string RoomUrl { get; set; } = string.Empty;
}
