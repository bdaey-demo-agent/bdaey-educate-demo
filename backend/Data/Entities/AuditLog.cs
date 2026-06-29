using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

public class AuditLog
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("ActorUser")]
    public string? ActorUserId { get; set; } // Nullable if system action? Usually not for Admin Audit.
    public ApplicationUser? ActorUser { get; set; }

    public string Action { get; set; } = string.Empty; // e.g., "BlockUser", "ApproveWithdrawal"
    
    public string TargetEntity { get; set; } = string.Empty; // e.g., "User", "Booking"
    public string? TargetEntityId { get; set; }

    public string? DetailsJson { get; set; } // JSON serialized details of the change

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public string? IPAddress { get; set; }
    
    public string? CorrelationId { get; set; } // To group related actions in a single transaction/flow
}
