using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class PackageDto
{
    public int Id { get; set; }
    public int TeacherProfileId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SessionsCount { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "EGP";
    public bool IsActive { get; set; }
    public string Status { get; set; } = "Active";
    public List<int> AvailableDays { get; set; } = new();
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public int MaxStudents { get; set; }
    public int ActiveBookingsCount { get; set; }

    // New Fields
    public string AllowedGender { get; set; } = "All";
    public string PeriodType { get; set; } = "Monthly";
    public int SessionsPerWeek { get; set; }
    public int SessionBufferMinutes { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public string TimezoneId { get; set; } = "Africa/Cairo";

    // Status
    public bool HasActiveBookings { get; set; }
    public bool HasPendingBookings { get; set; }

    // For Student View
    public string? CurrentUserBookingStatus { get; set; }
    public int? CurrentUserBookingId { get; set; }
}

public class CreatePackageDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue)]
    public int DurationMinutes { get; set; } = 60;

    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    public List<int> AvailableDays { get; set; } = new();
    public string StartTime { get; set; } = "09:00";
    public string EndTime { get; set; } = "17:00";
    public int MaxStudents { get; set; } = 10;

    // New Configs
    public string AllowedGender { get; set; } = "All";
    public string PeriodType { get; set; } = "Monthly";
    public int SessionsPerWeek { get; set; } = 1;
    public int SessionBufferMinutes { get; set; } = 15;
    public DateTimeOffset StartDate { get; set; }
    public string TimezoneId { get; set; } = "Africa/Cairo";
    public int? TeacherProfileId { get; set; }
}
