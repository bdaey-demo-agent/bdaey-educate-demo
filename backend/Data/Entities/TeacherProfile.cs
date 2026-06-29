using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class TeacherProfile
{
    [Key]
    public int Id { get; set; }
    
    [ForeignKey("User")]
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }

    public string Title { get; set; } = string.Empty; // e.g. Hafiz, Sheikh
    
    // List of subjects as array, maps to PostgreSQL text[]
    public List<string> Subjects { get; set; } = new();

    public string Bio { get; set; } = string.Empty;
    public decimal PriceStart { get; set; }
    public string Currency { get; set; } = "EGP";
    
    // Computed/Updated by backend logic
    public double AverageRating { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;

    // New Fields
    public string EducationDegree { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;
    
    // Percentage 0-100. If null, use global default.
    public decimal? CommissionRate { get; set; }

    // Scheduled Commission (Temporary)
    public decimal? ScheduledCommissionRate { get; set; }
    public DateTime? ScheduledCommissionUntil { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string ExperienceYears { get; set; } = string.Empty;
    public string? AudioSampleUrl { get; set; }
    public bool ShowAudioSample { get; set; } = true; // Default to true for backward compatibility
    public string? SocialLinks { get; set; } // JSON or comma-separated
    
    public bool HasIjaza { get; set; } = false;
    public bool IsHafiz { get; set; } = false; // New field
    public string? IjazaType { get; set; }
    public string? IjazaIssuer { get; set; }
    public string? IjazaCertificateUrl { get; set; }
    public bool ShowIjazaCertificate { get; set; } = false;
    
    // New Fields for Qualification and Experience Certificates
    public string? QualificationCertificateUrl { get; set; }
    public bool ShowQualificationCertificate { get; set; } = false;
    public string? ExperienceCertificateUrl { get; set; }
    public bool ShowExperienceCertificate { get; set; } = false;
    
    public string? NationalIdImageUrl { get; set; }
    
    // Order of sections on profile page
    public List<string> ProfileSectionsOrder { get; set; } = new();

    public bool IsDataSubmitted { get; set; } = false;
    public TeacherStatus Status { get; set; } = TeacherStatus.Pending;

    // Real-time Availability Toggle
    public bool IsOnline { get; set; } = false;

    // Configurable Penalty
    public decimal? PackageDeletionPenalty { get; set; }

    public List<Package> Packages { get; set; } = new();
}

public enum TeacherStatus
{
    Pending,
    Approved,
    Rejected
}
