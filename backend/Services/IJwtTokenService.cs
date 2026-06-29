using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Services;

public interface IJwtTokenService
{
    string GenerateJwtToken(ApplicationUser user, IList<string> roles);
}
