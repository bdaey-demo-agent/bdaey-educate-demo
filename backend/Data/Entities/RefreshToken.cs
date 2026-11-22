using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities;

/// <summary>
/// A long-lived refresh token used to mint short-lived JWT access tokens.
/// Only the SHA-256 hash of the token is stored; the raw token is returned
/// to the client exactly once at creation.
/// </summary>
public class RefreshToken
{
    [Key]
    public int Id { get; set; }

    /// <summary>SHA-256 hex digest of the raw token. Unique.</summary>
    [Required]
    [MaxLength(64)]
    public string TokenHash { get; set; } = string.Empty;

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public ApplicationUser? User { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RevokedAt { get; set; }

    /// <summary>Hash of the token that replaced this one during rotation.</summary>
    [MaxLength(64)]
    public string? ReplacedByTokenHash { get; set; }

    [MaxLength(256)]
    public string? RevokeReason { get; set; }

    [NotMapped]
    public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
}
