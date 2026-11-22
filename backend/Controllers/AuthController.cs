using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BdaeyEducat.API.Data;
using System.Text;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using Google.Apis.Auth;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly BdaeyEducat.API.Services.IEmailService _emailService;
    private readonly IWebHostEnvironment _env;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AuthController> _logger;
    private readonly BdaeyEducat.API.Services.IJwtTokenService _jwtTokenService;
    private readonly BdaeyEducat.API.Services.IRefreshTokenService _refreshTokenService;

    public AuthController(
        UserManager<ApplicationUser> userManager, 
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context,
        BdaeyEducat.API.Services.IEmailService emailService,
        IWebHostEnvironment env,
        IMemoryCache cache,
        ILogger<AuthController> logger,
        BdaeyEducat.API.Services.IJwtTokenService jwtTokenService,
        BdaeyEducat.API.Services.IRefreshTokenService refreshTokenService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _env = env;
        _cache = cache;
        _logger = logger;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            UserName = !string.IsNullOrEmpty(model.Username) ? model.Username : model.Email,
            Email = model.Email,
            FullName = model.FullName,
            PhoneNumber = model.PhoneNumber,
            DateOfBirth = model.DateOfBirth.ToUniversalTime(), // Ensure UTC for Npgsql
            NationalId = model.NationalId,
            Gender = model.Gender
        };

        IdentityResult result;
        try
        {
            result = await _userManager.CreateAsync(user, model.Password);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[REGISTER ERROR] CreateAsync failed");
            return StatusCode(500, "An internal error occurred during registration.");
        }

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Handle Role
        var role = !string.IsNullOrEmpty(model.Role) ? model.Role : "Student";
        
        // Ensure role exists
        if (!await _roleManager.RoleExistsAsync(role))
        {
            var roleResult = await _roleManager.CreateAsync(new IdentityRole(role));
            if (!roleResult.Succeeded) return BadRequest(roleResult.Errors);
        }

        // Add user to role
        await _userManager.AddToRoleAsync(user, role);

        // Create Teacher Profile if role is Teacher
        if (role == "Teacher")
        {
            var teacherProfile = new TeacherProfile
            {
                UserId = user.Id,
                Title = "New Teacher",
                Bio = "Profile under construction",
                Subjects = new List<string>(),
                PriceStart = 0,
                Status = TeacherStatus.Pending,
                IsApproved = false
            };
            _context.TeacherProfiles.Add(teacherProfile);
            await _context.SaveChangesAsync();
        }

        // --- EMAIL VERIFICATION START ---
        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
        var verifyLink = GetVerificationLink(user.Id, emailToken);

        try
        {
            await _emailService.SendEmailAsync(user.Email, $"Activate your {_configuration["Branding:NameEn"] ?? "Bdaey"} account", 
                BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));
            
            user.EmailConfirmationSentAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
        }
        
        // For Teachers, we do NOT log them in immediately. We ask them to verify email.
        if (role == "Teacher")
        {
            return Ok(new 
            { 
                message = "Registration successful. Please check your email to verify your account.",
                userId = user.Id,
                email = user.Email
            });
        }
        // --- EMAIL VERIFICATION END ---

        // Generate tokens (For Students or others who don't need immediate verification)
        // It's cleaner to just not check email confirmation in Login for non-teachers.
        return Ok(await BuildAuthResponseAsync(user, role));
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(string userId, string token)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
            return BadRequest("Invalid email confirmation request");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return BadRequest("User not found");

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            // Generate fresh tokens now that the email is confirmed
            return Ok(await BuildAuthResponseAsync(user, null));
        }

        return BadRequest("Email confirmation failed");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, model.Password))
        {
            return Unauthorized("Invalid email or password");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var userRole = roles.FirstOrDefault();

        // Enforce Email Verification ONLY for Teachers
        if (userRole == "Teacher" && !user.EmailConfirmed)
        {
            return Unauthorized(new { code = "EmailNotVerified", message = "Please verify your email before signing in." });
        }

        if (user.IsBlocked)
        {
            return StatusCode(403, new { code = "AccountSuspended", message = "Account has been suspended." });
        }

        return Ok(await BuildAuthResponseAsync(user, userRole));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleAuthDto model)
    {
        try
        {
            var clientId = _configuration["Google:ClientId"];
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { clientId! }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(model.IdToken, settings);
            
            if (payload == null) return BadRequest("Invalid Google token");

            var user = await _userManager.FindByEmailAsync(payload.Email);
            bool isNewUser = false;

            if (user == null)
            {
                if (!model.CreateIfNotExists)
                {
                    return NotFound(new { code = "AccountNotFound", message = "This account is not registered. Would you like to create a new account?" });
                }

                // Register new user
                user = new ApplicationUser
                {
                    UserName = payload.Email,
                    Email = payload.Email,
                    FullName = payload.Name,
                    EmailConfirmed = true, // Google emails are already verified
                    PhoneNumber = "", // Placeholder
                    DateOfBirth = DateTime.UtcNow.AddYears(-20), // Placeholder
                    NationalId = "00000000000000", // Placeholder
                    Gender = "Male" // Placeholder
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded) return BadRequest(createResult.Errors);

                var role = !string.IsNullOrEmpty(model.Role) ? model.Role : "Student";
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
                await _userManager.AddToRoleAsync(user, role);

                if (role == "Teacher")
                {
                    var teacherProfile = new TeacherProfile
                    {
                        UserId = user.Id,
                        Title = "New Teacher",
                        Bio = "Profile in progress",
                        Subjects = new List<string>(),
                        PriceStart = 0,
                        Status = TeacherStatus.Pending,
                        IsApproved = false
                    };
                    _context.TeacherProfiles.Add(teacherProfile);
                    await _context.SaveChangesAsync();
                }
                isNewUser = true;
            }

            if (user.IsBlocked)
            {
                return StatusCode(403, new { code = "AccountSuspended", message = "Account has been suspended." });
            }

            return Ok(await BuildAuthResponseAsync(user, null, isNewUser));
        }
        catch (InvalidJwtException)
        {
            return BadRequest("Invalid Google token");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Password changed successfully");
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var cacheKey = $"PasswordReset_{model.Email.ToLowerInvariant()}";
        if (_cache.TryGetValue(cacheKey, out _))
        {
            return BadRequest("Please wait 5 minutes before requesting a new link.");
        }

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return Ok("If this email is registered, a password reset link will arrive shortly.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin)) origin = _configuration["FrontendUrl"] ?? "https://bdaey.com";

        var resetLink = $"{origin}/reset-password?email={Uri.EscapeDataString(model.Email)}&token={Uri.EscapeDataString(token)}";

        await _emailService.SendEmailAsync(model.Email, $"Reset your {_configuration["Branding:NameEn"] ?? "Bdaey"} password", 
            BdaeyEducat.API.Services.EmailTemplates.GetPasswordResetEmail(user.FullName, resetLink));

        // Set the cache to prevent spamming for 5 minutes
        _cache.Set(cacheKey, true, TimeSpan.FromMinutes(5));

        return Ok("If this email is registered, a password reset link will arrive shortly.");
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) return BadRequest("Invalid request");

        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("Password has been reset successfully.");
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        return Ok(new { user.FullName, user.PhoneNumber, user.Email, user.Gender });
    }

    [HttpPost("resend-verification")]
    [Authorize]
    public async Task<IActionResult> ResendVerificationEmail()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (user.EmailConfirmed)
            return BadRequest("Email is already confirmed.");

        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var verifyLink = GetVerificationLink(user.Id, emailToken);

        await _emailService.SendEmailAsync(user.Email!, $"Activate your {_configuration["Branding:NameEn"] ?? "Bdaey"} account", 
            BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));

        user.EmailConfirmationSentAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok("Verification email sent successfully.");
    }

    [HttpPost("resend-verification-anonymous")]
    public async Task<IActionResult> ResendVerificationEmailAnonymous([FromBody] ResendVerificationDto model)
    {
        if (string.IsNullOrEmpty(model.Email)) return BadRequest("Email is required");

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null) 
            return Ok("If the email exists, a verification link has been sent."); // Privacy: don't reveal user existence

        if (user.EmailConfirmed)
            return BadRequest("Email is already confirmed.");

        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var verifyLink = GetVerificationLink(user.Id, emailToken);

        await _emailService.SendEmailAsync(user.Email!, $"Activate your {_configuration["Branding:NameEn"] ?? "Bdaey"} account", 
            BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));

        user.EmailConfirmationSentAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        return Ok("Verification email sent successfully.");
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto model)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        user.FullName = model.FullName;
        user.PhoneNumber = model.PhoneNumber;
        
        if (model.Gender != null) {
            user.Gender = model.Gender;
        }

        bool emailChanged = false;

        // Check if an email update was requested and it's different
        if (!string.IsNullOrWhiteSpace(model.Email) && !string.Equals(user.Email, model.Email, StringComparison.OrdinalIgnoreCase))
        {
            // Check if the new email is already taken by another user
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest("This email is already in use.");
            }

            user.Email = model.Email;
            user.UserName = model.Email; // Optional: keep username in sync if your logic relies on it
            user.EmailConfirmed = false; // Require re-verification
            emailChanged = true;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        
        if (!updateResult.Succeeded)
        {
             return BadRequest("Failed to update your details. Please try again later.");
        }

        // If email changed, send a new verification email
        if (emailChanged)
        {
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var verifyLink = GetVerificationLink(user.Id, emailToken);

            await _emailService.SendEmailAsync(user.Email!, $"Activate your {_configuration["Branding:NameEn"] ?? "Bdaey"} account", 
                BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));

            user.EmailConfirmationSentAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        // Always issue new tokens on profile update so claims (FullName, Email, EmailConfirmed) stay fresh
        return Ok(await BuildAuthResponseAsync(user, null));
    }

    /// <summary>
    /// Exchanges a valid refresh token for a new access token + rotated refresh token.
    /// Anonymous by design: the refresh token itself is the credential.
    /// </summary>
    [HttpPost("refresh")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.RefreshToken))
            return BadRequest("Refresh token is required");

        var result = await _refreshTokenService.RotateAsync(model.RefreshToken);
        if (!result.Success || result.User == null)
        {
            return Unauthorized(new { code = "InvalidRefreshToken", message = result.Error ?? "Session expired. Please log in again." });
        }

        if (result.User.IsBlocked)
        {
            return StatusCode(403, new { code = "AccountSuspended", message = "Account has been suspended." });
        }

        return Ok(await BuildAuthResponseAsync(result.User, null, existingRefreshToken: result.NewRawToken));
    }

    /// <summary>Revokes a refresh token on logout. Best effort, always succeeds.</summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto model)
    {
        if (!string.IsNullOrWhiteSpace(model?.RefreshToken))
        {
            await _refreshTokenService.RevokeAsync(model.RefreshToken, "User logged out");
        }
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("test-email")]
    public async Task<IActionResult> TestEmail([FromQuery] string to)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        if (string.IsNullOrEmpty(to)) return BadRequest("Email 'to' is required");

        try
        {
            await _emailService.SendEmailAsync(
                to,
                "Test Email from Bdaey",
                "<h2>Email Service is working!</h2>"
            );
            return Ok("Email Sent");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }

    [HttpGet("check-username")]
    public async Task<IActionResult> CheckUsernameAvailability([FromQuery] string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return BadRequest("Username cannot be empty");

        var user = await _userManager.FindByNameAsync(username);
        return Ok(new { isAvailable = user == null });
    }

    private string GetVerificationLink(string userId, string emailToken)
    {
        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin)) origin = _configuration["FrontendUrl"] ?? "https://bdaey.com";
        return $"{origin}/verify-email?userId={userId}&token={Uri.EscapeDataString(emailToken)}";
    }

    /// <summary>
    /// Issues a short-lived access token plus a rotating refresh token and shapes the
    /// standard auth response. Single place so every login path stays consistent.
    /// </summary>
    private async Task<AuthResponseDto> BuildAuthResponseAsync(ApplicationUser user, string? role, bool isNewUser = false, string? existingRefreshToken = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtTokenService.GenerateJwtToken(user, roles.ToList());
        // During rotation the rotated token is passed in; minting another one here would
        // leave a valid orphan token in the database.
        var refreshToken = existingRefreshToken ?? await _refreshTokenService.CreateAsync(user);

        return new AuthResponseDto
        {
            Id = user.Id,
            Token = accessToken,
            RefreshToken = refreshToken,
            Email = user.Email!,
            FullName = user.FullName,
            Role = role ?? roles.FirstOrDefault(),
            UserName = user.UserName,
            Expiration = _jwtTokenService.GetAccessTokenExpiry(),
            IsBlocked = user.IsBlocked,
            EmailConfirmed = user.EmailConfirmed,
            Gender = user.Gender,
            IsNewUser = isNewUser
        };
    }
}
