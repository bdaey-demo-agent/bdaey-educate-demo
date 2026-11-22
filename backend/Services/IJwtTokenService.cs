using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Services;

public interface IJwtTokenService
{
    string GenerateJwtToken(ApplicationUser user, IList<string> roles);

    /// <summary>The UTC instant at which a newly issued access token expires.</summary>
    DateTime GetAccessTokenExpiry();
}
