using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos
{
    public class BulkDepositDto
    {
        public List<int> TeacherProfileIds { get; set; } = new();
        public bool IsAll { get; set; } = false; // If true, ignore TeacherProfileIds and deposit to ALL approved teachers
        
        [Required]
        [Range(0.01, 1000000)]
        public decimal Amount { get; set; }
        
        public string Description { get; set; } = string.Empty;
    }
}
