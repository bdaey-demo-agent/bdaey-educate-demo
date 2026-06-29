using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class GoogleAuthDto
{
    public string IdToken { get; set; } = string.Empty;

    [RegularExpression("^(Student|Teacher|Admin)$", ErrorMessage = "Role must be one of: Student, Teacher, Admin")]
    public string Role { get; set; } = "Student";

    public bool CreateIfNotExists { get; set; } = false;
}
