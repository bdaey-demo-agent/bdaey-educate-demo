using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Route("api/admin/users")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IAuditLogService _auditLogService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IJwtTokenService _jwtTokenService;

    public AdminUsersController(
        UserManager<ApplicationUser> userManager, 
        ApplicationDbContext context, 
        IAuditLogService auditLogService,
        IEmailService emailService,
        IConfiguration configuration,
        IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _context = context;
        _auditLogService = auditLogService;
        _emailService = emailService;
        _configuration = configuration;
        _jwtTokenService = jwtTokenService;
    }

    // GET /api/admin/users
    [HttpGet]
    public async Task<ActionResult> GetAllUsers([FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 50;
        if (pageSize > 200) pageSize = 200;

        List<ApplicationUser> users;
        int totalCount;

        if (!string.IsNullOrEmpty(role))
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(role);
            users = usersInRole.OrderByDescending(u => u.CreatedAt).ToList();
            totalCount = users.Count;
            users = users.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        }
        else
        {
            var query = _context.Users.OrderByDescending(u => u.CreatedAt).AsQueryable();
            totalCount = await query.CountAsync();
            users = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        }

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            users = users.Where(u => 
                (u.Email != null && u.Email.ToLower().Contains(search)) || 
                (u.FullName.ToLower().Contains(search))
            ).ToList();
        }

        var result = new List<object>();
        foreach (var u in users)
        {
            var userRoles = await _userManager.GetRolesAsync(u);
            result.Add(new 
            {
                u.Id,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                Role = userRoles.FirstOrDefault() ?? "None",
                u.IsBlocked,
                u.CreatedAt,
                u.EmailConfirmed,
                u.EmailConfirmationSentAt
            });
        }

        return Ok(new { TotalCount = totalCount, Page = page, PageSize = pageSize, Data = result });
    }

    public class BlockUserDto
    {
        public bool IsBlocked { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }

    [HttpPut("{id}/block")]
    public async Task<IActionResult> ToggleBlockUser(string id, [FromBody] BlockUserDto dto)
    {
        try
        {
            if (dto == null) return BadRequest("Invalid request body.");

            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var correlationId = Guid.NewGuid().ToString();

            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Prevent blocking self
            if (user.Id == adminId) return BadRequest("Cannot block yourself.");

            // Prevent blocking the system administrator (Case-insensitive check)
            var adminEmail = _configuration["Admin:Email"] ?? string.Empty;
            if (!string.IsNullOrEmpty(adminEmail) && string.Equals(user.Email, adminEmail, StringComparison.OrdinalIgnoreCase)) 
                return BadRequest("The system admin cannot be blocked.");

            user.IsBlocked = dto.IsBlocked;
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                await _auditLogService.LogAsync(
                    adminId!, 
                    user.IsBlocked ? "BlockUser" : "UnblockUser", 
                    "User", 
                    id, 
                    new { IsBlocked = dto.IsBlocked, Reason = dto.Reason }, 
                    correlationId
                );
                return Ok(new { Message = user.IsBlocked ? "User blocked" : "User unblocked" });
            }

            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return StatusCode(500, $"Failed to update user: {errors}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        try
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.NewPassword)) 
                return BadRequest("New password is required.");

            if (dto.NewPassword.Length < 6)
                return BadRequest("Password must be at least 6 characters.");

            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var adminEmail = _configuration["Admin:Email"] ?? string.Empty;
            
            if (!string.IsNullOrEmpty(adminEmail) && 
                string.Equals(user.Email, adminEmail, StringComparison.OrdinalIgnoreCase) && 
                !string.Equals(User.FindFirstValue(ClaimTypes.Email), adminEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("You cannot change the main system admin password.");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);

            if (result.Succeeded)
            {
                await _auditLogService.LogAsync(
                    adminId!, 
                    "AdminResetPassword", 
                    "User", 
                    id, 
                    new { Email = user.Email }, 
                    Guid.NewGuid().ToString()
                );
                return Ok(new { Message = "New password set successfully." });
            }

            return StatusCode(500, new { Message = "Failed to change the password. Please try again later." });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "Failed to change the password. Please try again later." });
        }
    }

    // POST /api/admin/users/{id}/resend-verification
    [HttpPost("{id}/resend-verification")]
    public async Task<IActionResult> ResendVerificationEmail(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        if (user.EmailConfirmed)
            return BadRequest("This email is already verified.");

        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        
        var origin = Request.Headers["Origin"].ToString();
        if (string.IsNullOrEmpty(origin)) origin = _configuration["FrontendUrl"] ?? "https://bdaey.com";

        var verifyLink = $"{origin}/verify-email?userId={user.Id}&token={Uri.EscapeDataString(emailToken)}";

        await _emailService.SendEmailAsync(user.Email!, $"Activate your {_configuration["Branding:NameEn"] ?? "Bdaey"} account", 
            BdaeyEducat.API.Services.EmailTemplates.GetVerificationEmail(user.FullName, verifyLink));

        user.EmailConfirmationSentAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        await _auditLogService.LogAsync(adminId!, "ResendVerification", "User", id, new { Email = user.Email }, Guid.NewGuid().ToString());

        return Ok(new { Message = "Activation email resent." });
    }

    [HttpPost("{id}/impersonate")]
    public async Task<IActionResult> ImpersonateUser(string id)
    {
        try
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var adminEmail = User.FindFirstValue(ClaimTypes.Email);

            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound("User not found.");

            // Prevent impersonating another Admin (security)
            var userRoles = await _userManager.GetRolesAsync(user);
            if (userRoles.Contains("Admin"))
            {
                return BadRequest("You cannot sign in as another admin.");
            }

            if (user.IsBlocked)
            {
                return BadRequest("This account is blocked.");
            }

            var token = _jwtTokenService.GenerateJwtToken(user, userRoles);
            var userRole = userRoles.FirstOrDefault();

            await _auditLogService.LogAsync(
                adminId!, 
                "ImpersonateUser", 
                "User", 
                id, 
                new { AdminEmail = adminEmail, TargetUserEmail = user.Email }, 
                Guid.NewGuid().ToString()
            );

            return Ok(new BdaeyEducat.API.Dtos.AuthResponseDto
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
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal Server Error: {ex.Message}");
        }
    }
}
