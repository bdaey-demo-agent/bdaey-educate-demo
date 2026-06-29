using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class Booking
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Student")]
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }

    [ForeignKey("TeacherProfile")]
    public int TeacherProfileId { get; set; }
    public TeacherProfile? TeacherProfile { get; set; }

    [ForeignKey("Package")]
    public int? PackageId { get; set; }
    public Package? Package { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    
    // Payment Status - separates completion from payment (which now depends on ratings)
    public bool IsPaidToTeacher { get; set; } = false;
    
    public decimal TotalPrice { get; set; }
    public string Currency { get; set; } = "EGP";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    
    public string? CancellationReason { get; set; }
    
    // Sessions related to this booking
    public List<Session> Sessions { get; set; } = new();
}

public enum BookingStatus
{
    Pending,        // Waiting for teacher acceptance
    Confirmed,      // Teacher accepted
    Cancelled,      // Cancelled by student or teacher
    Completed       // All sessions completed
}
