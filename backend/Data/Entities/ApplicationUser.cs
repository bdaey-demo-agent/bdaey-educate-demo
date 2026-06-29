using Microsoft.AspNetCore.Identity;

namespace BdaeyEducat.API.Data.Entities;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string NationalId { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Link to Wallet
    public Wallet? Wallet { get; set; }

    public bool IsBlocked { get; set; } = false;

    // Gamification
    public int TotalPoints { get; set; } = 0;
    // Emails
    public DateTime? EmailConfirmationSentAt { get; set; }
}
