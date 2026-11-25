using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BdaeyEducat.API.Data.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BdaeyEducat.API.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

public string GenerateJwtToken(ApplicationUser user, IList<string> roles)
    => GenerateJwtToken(user, roles, Array.Empty<Claim>(), GetAccessTokenExpiry());
    
    public string GenerateJwtToken(ApplicationUser user, IList<string> roles, IEnumerable<Claim> extraClaims, DateTime expiresUtc)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id), // Explicitly mapped for SignalR UserIdentifier
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.Email, user.Email ?? ""),
            new("FullName", user.FullName ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        claims.AddRange(extraClaims);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = GetAccessTokenExpiry(),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        tokenDescriptor.Expires = expiresUtc;

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public DateTime GetAccessTokenExpiry()
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        // Preferred setting: Jwt:ExpireMinutes. Jwt:ExpireDays is kept as a
        // fallback so older deployments do not break before their config is updated.
        var minutes = jwtSettings.GetValue<double?>("ExpireMinutes");
        if (minutes.HasValue)
        {
            return DateTime.UtcNow.AddMinutes(minutes.Value);
        }

        var days = jwtSettings.GetValue<double?>("ExpireDays") ?? 30;
        return DateTime.UtcNow.AddDays(days);
    }
}
