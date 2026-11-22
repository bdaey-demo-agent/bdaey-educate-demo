using System.Security.Cryptography;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Services;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RefreshTokenService> _logger;

    public RefreshTokenService(ApplicationDbContext context, IConfiguration configuration, ILogger<RefreshTokenService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> CreateAsync(ApplicationUser user)
    {
        var rawToken = GenerateRawToken();
        _context.RefreshTokens.Add(new RefreshToken
        {
            TokenHash = Hash(rawToken),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenDays())
        });
        await _context.SaveChangesAsync();
        return rawToken;
    }

    public async Task<RefreshRotationResult> RotateAsync(string rawToken)
    {
        var hash = Hash(rawToken);
        var token = await _context.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (token == null)
        {
            return RefreshRotationResult.Fail("Invalid refresh token");
        }

        if (token.RevokedAt != null)
        {
            // A revoked token was presented again: treat as possible token theft and
            // kill every active session of this user.
            _logger.LogWarning("Refresh token reuse detected for user {UserId}; revoking all sessions", token.UserId);
            var activeTokens = await _context.RefreshTokens
                .Where(t => t.UserId == token.UserId && t.RevokedAt == null)
                .ToListAsync();
            foreach (var t in activeTokens)
            {
                t.RevokedAt = DateTime.UtcNow;
                t.RevokeReason = "Refresh token reuse detected";
            }
            await _context.SaveChangesAsync();
            return RefreshRotationResult.Fail("Session revoked. Please log in again.");
        }

        if (DateTime.UtcNow >= token.ExpiresAt)
        {
            return RefreshRotationResult.Fail("Refresh token expired");
        }

        if (token.User == null)
        {
            return RefreshRotationResult.Fail("User not found");
        }

        var newRawToken = GenerateRawToken();
        token.RevokedAt = DateTime.UtcNow;
        token.RevokeReason = "Rotated";
        token.ReplacedByTokenHash = Hash(newRawToken);

        _context.RefreshTokens.Add(new RefreshToken
        {
            TokenHash = Hash(newRawToken),
            UserId = token.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenDays())
        });

        await _context.SaveChangesAsync();
        return RefreshRotationResult.Ok(newRawToken, token.User);
    }

    public async Task RevokeAsync(string rawToken, string reason)
    {
        var hash = Hash(rawToken);
        var token = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token == null || token.RevokedAt != null)
        {
            return;
        }

        token.RevokedAt = DateTime.UtcNow;
        token.RevokeReason = reason;
        await _context.SaveChangesAsync();
    }

    private double GetRefreshTokenDays() =>
        _configuration.GetSection("Jwt").GetValue<double?>("RefreshTokenDays") ?? 14;

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken)));
}
