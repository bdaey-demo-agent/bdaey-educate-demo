using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class RegisterDto
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public required string FullName { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public required string Password { get; set; }

    [Phone]
    public required string PhoneNumber { get; set; }

    public DateTime DateOfBirth { get; set; }

    public string? NationalId { get; set; }

    [Required]
    [RegularExpression("^(Male|Female)$", ErrorMessage = "Gender must be Male or Female")]
    public required string Gender { get; set; }

    [RegularExpression("^(Student|Teacher)$", ErrorMessage = "Public registration only supports Student or Teacher")]
    public string? Role { get; set; }

    [StringLength(100)]
    public string? Username { get; set; }
}
