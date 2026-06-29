using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class CreateTeacherProfileDto
{
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public List<string> Subjects { get; set; } = new();
    
    [Required]
    public string Bio { get; set; } = string.Empty;
    
    [Required]
    [Range(0, double.MaxValue)]
    public decimal PriceStart { get; set; }
    
    public string Currency { get; set; } = "EGP";

    public string EducationDegree { get; set; } = string.Empty;
    public bool HasIjaza { get; set; }
    public bool IsHafiz { get; set; }
    public string? IjazaType { get; set; }
    public string? IjazaIssuer { get; set; }
    public string ExperienceYears { get; set; } = string.Empty;
    public string? SocialLinks { get; set; }
}

public class TeacherProfileResponseDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Subjects { get; set; } = new();
    public string Bio { get; set; } = string.Empty;
    public decimal PriceStart { get; set; }
    public string Currency { get; set; } = "EGP";
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public int StudentCount { get; set; }
    
    public string EducationDegree { get; set; } = string.Empty;
    public bool HasIjaza { get; set; }
    public bool IsHafiz { get; set; }
    public string? IjazaType { get; set; }
    public string? IjazaIssuer { get; set; }
    public string ExperienceYears { get; set; } = string.Empty;
    public string? AudioSampleUrl { get; set; }
    public bool ShowAudioSample { get; set; }
    public string? SocialLinks { get; set; }
    public string Status { get; set; } = "Pending";
    public string? NationalIdImageUrl { get; set; }
    public string? IjazaCertificateUrl { get; set; }
    public string? QualificationCertificateUrl { get; set; }
    public string? ExperienceCertificateUrl { get; set; }
    
    public bool ShowQualificationCertificate { get; set; }
    public bool ShowExperienceCertificate { get; set; }
    public bool ShowIjazaCertificate { get; set; }
    public string? PhoneNumber { get; set; }
    public string? NationalId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    
    public decimal? MinPackagePrice { get; set; }
    
    public decimal EffectivePackageDeletionPenalty { get; set; } = 50; // Default fallback

    public List<string> ProfileSectionsOrder { get; set; } = new();
    
    // New fields for Phase 3 filtering
    public string Gender { get; set; } = string.Empty;
    public bool IsOnline { get; set; } 
    public bool IsDataSubmitted { get; set; }
}

public class UpdateTeacherProfileDto
{
    public string? Title { get; set; }
    public List<string>? Subjects { get; set; }
    public string? Bio { get; set; }
    public decimal? PriceStart { get; set; }
    public string? Currency { get; set; }
    
    public string? EducationDegree { get; set; }
    public bool? HasIjaza { get; set; }
    public bool? IsHafiz { get; set; }
    public string? IjazaType { get; set; }
    public string? IjazaIssuer { get; set; }
    public string? ExperienceYears { get; set; }
    public string? SocialLinks { get; set; }
    public string? AudioSampleUrl { get; set; }
    public bool? ShowAudioSample { get; set; }
    
    public bool? ShowQualificationCertificate { get; set; }
    public bool? ShowExperienceCertificate { get; set; }
    public bool? ShowIjazaCertificate { get; set; }
    
    public List<string>? ProfileSectionsOrder { get; set; }
}
