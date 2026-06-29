using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class BookingDto
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public int TeacherProfileId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int? PackageId { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "EGP";
    public DateTimeOffset CreatedAt { get; set; }
    public int SessionsCount { get; set; }
}

public class CreateBookingDto
{
    [Required]
    [Range(1, int.MaxValue)]
    public int TeacherProfileId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int PackageId { get; set; }

    public string TimezoneId { get; set; } = "Africa/Cairo";
    public List<DateTimeOffset> ProposedTimes { get; set; } = new();
}

public class BookingStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
