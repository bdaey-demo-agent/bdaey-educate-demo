using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class RegisterDto
{
    public required string FullName { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public required string Password { get; set; }

    [Phone]
    public required string PhoneNumber { get; set; }

    public DateTime DateOfBirth { get; set; }

    public string? NationalId { get; set; }

    public required string Gender { get; set; }

    public string? Role { get; set; }

    public string? Username { get; set; }
}
