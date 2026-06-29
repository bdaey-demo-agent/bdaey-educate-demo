using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Data.Entities;

public class ContactMessage
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Reason { get; set; } = "General"; // General, Suspension, etc.
    
    public string? Subject { get; set; }
    
    [Required]
    public string Message { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsRead { get; set; } = false;
}
