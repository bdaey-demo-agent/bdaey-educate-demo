using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string NewPassword { get; set; } = string.Empty;
}

public class UpdateProfileDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;
    
    [Phone]
    public string? PhoneNumber { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    public string? Gender { get; set; }
}
