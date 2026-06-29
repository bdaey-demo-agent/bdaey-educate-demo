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

    public AuthController(
        UserManager<ApplicationUser> userManager, 
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ApplicationDbContext context,
        BdaeyEducat.API.Services.IEmailService emailService,
        IWebHostEnvironment env,
        IMemoryCache cache,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _env = env;
        _cache = cache;
        _logger = logger;
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
            NationalId = model.NationalId ?? string.Empty,
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
            await _emailService.SendEmailAsync(user.Email, "تفعيل حسابك في منصة بدائي", 
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

        // Generate Token (For Students or others who don't need immediate verification)
        var token = await GenerateJwtToken(user);
        
        // Ensure EmailConfirmed is true for non-teachers if we want to skip verification logic for them
        // Or just leave it as false but don't check it in Login.
        // Let's safe-guard: if not teacher, maybe auto-confirm? 
        // User said "Verify teacher email ONLY".
        // It's cleaner to just not check it in Login for others.

        return Ok(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email!,
            FullName = user.FullName,
            Role = role,
            UserName = user.UserName,
            Expiration = DateTime.UtcNow.AddDays(30),
            EmailConfirmed = user.EmailConfirmed,
            Gender = user.Gender
        });
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
            // Generate a fresh token with EmailConfirmed=true claim
            var newToken = await GenerateJwtToken(user);
            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault();

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                Token = newToken,
                Email = user.Email!,
                FullName = user.FullName,
                Role = userRole,
                UserName = user.UserName,
                Expiration = DateTime.UtcNow.AddDays(30),
                IsBlocked = user.IsBlocked,
                EmailConfirmed = user.EmailConfirmed,
                Gender = user.Gender
            });
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
            return Unauthorized(new { code = "EmailNotVerified", message = "يرجى تفعيل بريدك الإلكتروني قبل تسجيل الدخول." });
        }

        if (user.IsBlocked)
        {
            return StatusCode(403, new { code = "AccountSuspended", message = "Account has been suspended." });
        }

        var token = await GenerateJwtToken(user);

        return Ok(new AuthResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email!,
            FullName = user.FullName,
            Role = userRole,
            UserName = user.UserName,
            Expiration = DateTime.UtcNow.AddDays(30),
            IsBlocked = user.IsBlocked,
            EmailConfirmed = user.EmailConfirmed,
            Gender = user.Gender
        });
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
                    return NotFound(new { code = "AccountNotFound", message = "هذا الحساب غير مسجل لدينا. هل تريد إنشاء حساب جديد؟" });
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
                        Title = "معلم جديد",
                        Bio = "بروفايل قيد الإنشاء",
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

            var roles = await _userManager.GetRolesAsync(user);
            var token = await GenerateJwtToken(user);

            return Ok(new AuthResponseDto
            {
                Id = user.Id,
                Token = token,
                Email = user.Email!,
                FullName = user.FullName,
                Role = roles.FirstOrDefault(),
                UserName = user.UserName,
                Expiration = DateTime.UtcNow.AddDays(30),
                IsBlocked = user.IsBlocked,
                EmailConfirmed = user.EmailConfirmed,
                Gender = user.Gender,
                IsNewUser = isNewUser
            });
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
            return BadRequest("يرجى الانتظار 5 دقائق قبل طلب رابط جديد.");
        }

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return Ok("في حال كان البريد مسجلاً لدينا، سيصلك رابط استعادة كلمة المرور قريباً.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin)) origin = _configuration["FrontendUrl"] ?? "https://bdaey.com";

        var resetLink = $"{origin}/reset-password?email={Uri.EscapeDataString(model.Email)}&token={Uri.EscapeDataString(token)}";

        await _emailService.SendEmailAsync(model.Email, "استعادة كلمة المرور في منصة بدائي", 
            BdaeyEducat.API.Services.EmailTemplates.GetPasswordResetEmail(user.FullName, resetLink));

        // Set the cache to prevent spamming for 5 minutes
        _cache.Set(cacheKey, true, TimeSpan.FromMinutes(5));

        return Ok("في حال كان البريد مسجلاً لدينا، سيصلك رابط استعادة كلمة المرور قريباً.");
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

        await _emailService.SendEmailAsync(user.Email!, "تفعيل حسابك في منصة بدائي", 
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

        await _emailService.SendEmailAsync(user.Email!, "تفعيل حسابك في منصة بدائي", 
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
                return BadRequest("هذا البريد الإلكتروني مستخدم بالفعل.");
            }

            user.Email = model.Email;
            user.UserName = model.Email; // Optional: keep username in sync if your logic relies on it
            user.EmailConfirmed = false; // Require re-verification
            emailChanged = true;
        }

        var updateResult = await _userManager.UpdateAsync(user);
        
        if (!updateResult.Succeeded)
        {
             return BadRequest("فشل تحديث البيانات، يرجى المحاولة لاحقاً.");
        }

        // If email changed, send a new verification email
        if (emailChanged)
        {
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var verifyLink = GetVerificationLink(user.Id, emailToken);

            await _emailService.SendEmailAsync(user.Email!, "تفعيل حسابك في منصة بدائي", 
                BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));

            user.EmailConfirmationSentAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        // Always issue a new token on profile update so Claims (FullName, Email, EmailConfirmed) stay fresh
        var newToken = await GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);
        var userRole = roles.FirstOrDefault();

        return Ok(new AuthResponseDto
        {
            Id = user.Id,
            Token = newToken,
            Email = user.Email!,
            FullName = user.FullName,
            Role = userRole,
            UserName = user.UserName,
            Expiration = DateTime.UtcNow.AddDays(30),
            IsBlocked = user.IsBlocked,
            EmailConfirmed = user.EmailConfirmed,
            Gender = user.Gender
        });
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

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]!);
        var userRoles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.NameIdentifier, user.Id), // Explicitly map for SignalR UserIdentifier
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim("FullName", user.FullName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add roles to claims
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(jwtSettings["ExpireDays"])),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
