using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;

namespace BdaeyEducat.API.Dtos;

public class UpdateTeacherProfileWithDocsDto
{
    public string? Title { get; set; }
    public List<string>? Subjects { get; set; }
    public string? Bio { get; set; }
    public decimal? PriceStart { get; set; }
    public string? Currency { get; set; }
    public string? EducationDegree { get; set; }
    public bool? IsHafiz { get; set; }
    public bool? HasIjaza { get; set; }
    public string? IjazaType { get; set; }
    public string? IjazaIssuer { get; set; }
    public string? ExperienceYears { get; set; }
    public string? SocialLinks { get; set; }
    public string? AudioSampleUrl { get; set; }

    public string? NationalId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public IFormFile? NationalIdImage { get; set; }
    public IFormFile? IjazaCertificateImage { get; set; }
    
    // New Files
    public IFormFile? QualificationCertificateImage { get; set; }
    public IFormFile? ExperienceCertificateImage { get; set; }
    public IFormFile? ProfilePictureImage { get; set; }
    
    public bool? ShowQualificationCertificate { get; set; }
    public bool? ShowExperienceCertificate { get; set; }
    public bool? ShowIjazaCertificate { get; set; }
    public bool? ShowAudioSample { get; set; }
    
    // Order
    public List<string>? ProfileSectionsOrder { get; set; }
}
