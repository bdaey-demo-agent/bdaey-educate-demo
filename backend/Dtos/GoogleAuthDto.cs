using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class GoogleAuthDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;

    [RegularExpression("^(Student|Teacher)$", ErrorMessage = "Public Google registration only supports Student or Teacher")]
    public string Role { get; set; } = "Student";

    public bool CreateIfNotExists { get; set; } = false;
}
