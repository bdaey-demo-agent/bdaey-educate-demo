using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class Session
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Booking")]
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    [ForeignKey("Student")]
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }

    [ForeignKey("TeacherProfile")]
    public int TeacherProfileId { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }

    public DateTimeOffset ScheduledAt { get; set; }
    public string TimezoneId { get; set; } = "Africa/Cairo"; // IANA Timezone ID
    public int DurationMinutes { get; set; } = 60;
    
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;
    
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    public string? RoomUrl { get; set; } // Legacy field/Common field
    public string? RecordingUrl { get; set; }

    // Enhanced Video Meeting Fields
    public string? VideoProvider { get; set; } // "daily", "agora"
    public string? DailyRoomName { get; set; }
    public string? VideoStatus { get; set; } // scheduled, ready, live, ended
    
    // Rating (filled after session)
    [Range(1, 5)]
    public int? Rating { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime? ReviewedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Financial & Settlement Fields
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; } // Snapshot of session price (Booking.TotalPrice / SessionsCount)

    public bool IsPaidToTeacher { get; set; } = false;
    public DateTime? PaidAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? PayoutAmount { get; set; } // Net amount paid to teacher

    public DateTime? FinalizedAt { get; set; }
    public string? FinalizedBy { get; set; } // "Student", "System", "Admin"
}

public enum SessionStatus
{
    Scheduled,      // Scheduled but not started
    InProgress,     // Currently happening
    Completed,      // Finished successfully
    Cancelled,      // Cancelled before start
    NoShow          // Student didn't show up
}
