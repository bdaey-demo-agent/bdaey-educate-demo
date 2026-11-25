using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Services;

public interface IJwtTokenService
{
    string GenerateJwtToken(ApplicationUser user, IList<string> roles);

/// <summary>Demo-only: token with extra claims and an explicit expiry.</summary>
string GenerateJwtToken(ApplicationUser user, IList<string> roles, IEnumerable<System.Security.Claims.Claim> extraClaims, DateTime expiresUtc);

    /// <summary>The UTC instant at which a newly issued access token expires.</summary>
    DateTime GetAccessTokenExpiry();
}
