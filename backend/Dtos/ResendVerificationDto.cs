using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class ResendVerificationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
