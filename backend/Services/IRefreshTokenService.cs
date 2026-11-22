using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Services;

public interface IRefreshTokenService
{
    /// <summary>Creates a new refresh token for the user and returns the raw token (shown once).</summary>
    Task<string> CreateAsync(ApplicationUser user);

    /// <summary>
    /// Validates a raw refresh token and rotates it: the presented token is revoked and a
    /// new one is issued. If an already-revoked token is presented (reuse = possible theft),
    /// every active token of that user is revoked and the rotation fails.
    /// </summary>
    Task<RefreshRotationResult> RotateAsync(string rawToken);

    /// <summary>Revokes one raw refresh token (best effort; unknown tokens are ignored).</summary>
    Task RevokeAsync(string rawToken, string reason);
}

public class RefreshRotationResult
{
    public bool Success { get; set; }
    public string? NewRawToken { get; set; }
    public ApplicationUser? User { get; set; }
    public string? Error { get; set; }

    public static RefreshRotationResult Fail(string error) => new() { Success = false, Error = error };

    public static RefreshRotationResult Ok(string newRawToken, ApplicationUser user) =>
        new() { Success = true, NewRawToken = newRawToken, User = user };
}
