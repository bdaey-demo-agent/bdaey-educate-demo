using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos;

public class BulkDepositStudentDto
{
    public List<string> UserIds { get; set; } = new();
    public bool IsAll { get; set; }

    [Range(1, 1000000)]
    public decimal Amount { get; set; }

    public string Description { get; set; } = string.Empty;
}
