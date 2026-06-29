using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class Package
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("TeacherProfile")]
    public int TeacherProfileId { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }

    public string Name { get; set; } = string.Empty; // e.g., "4 sessions/month", "8 sessions/month"
    public string Description { get; set; } = string.Empty;
    
    public int SessionsCount { get; set; } // Number of sessions in this package
    public int DurationMinutes { get; set; } = 60; // Duration per session in minutes
    
    public decimal Price { get; set; }
    public string Currency { get; set; } = "EGP";
    
    // public bool IsActive { get; set; } = true; // Removed in favor of Status
    
    public BdaeyEducat.API.Data.Enums.PackageStatus Status { get; set; } = BdaeyEducat.API.Data.Enums.PackageStatus.Active;
    
    public string? AdminNote { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public DateTime? PausedAt { get; set; }
    
    // Availability Configuration
    public List<int> AvailableDays { get; set; } = new(); // 0=Sunday, 1=Monday... (using .NET DayOfWeek)
    public TimeSpan StartTime { get; set; } // e.g. 07:00
    public TimeSpan EndTime { get; set; }   // e.g. 16:00
    public int MaxStudents { get; set; } = 10; // Max active students allowed for this package

    // Package Constraints
    public string AllowedGender { get; set; } = "All"; // "All", "Male", "Female"
    public string PeriodType { get; set; } = "Monthly"; // "Weekly", "Monthly", "Yearly"
    public int SessionsPerWeek { get; set; } = 1; // 1, 2, 3
    public int SessionBufferMinutes { get; set; } = 15; // 10, 15, 20, 25, 30
    public DateTimeOffset StartDate { get; set; } = DateTimeOffset.UtcNow.Date; // Mandatory Start Date
    public DateTimeOffset EndDate { get; set; } // Calculated End Date
    public string TimezoneId { get; set; } = "Africa/Cairo"; // IANA Timezone ID

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
