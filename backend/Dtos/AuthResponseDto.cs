namespace BdaeyEducat.API.Dtos;

public class AuthResponseDto
{
    // 'required' modifier ensures these properties are initialized during object creation.
    // This prevents null reference issues in the response.
    public required string Id { get; set; }
    public required string Token { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public string? Role { get; set; }
    public string? UserName { get; set; }
    public DateTime Expiration { get; set; }
    public bool IsBlocked { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? Gender { get; set; }
    public bool IsNewUser { get; set; }
}
