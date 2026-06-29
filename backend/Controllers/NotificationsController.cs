using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using BdaeyEducat.API.Hubs;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _userManager = userManager;
        _hubContext = hubContext;
    }

    // GET: api/notifications
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetNotifications()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new 
            {
                n.Id,
                n.Title,
                n.Message,
                n.IsRead,
                n.Type,
                n.CreatedAt,
                n.RelatedEntityId
            })
            .ToListAsync();

        return Ok(notifications);
    }

    // PUT: api/notifications/5/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

        if (notification == null) return NotFound();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/notifications/read-all
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (notifications.Any())
        {
            foreach (var n in notifications) n.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    // POST: api/notifications/send (Admin Only)
    [HttpPost("send")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var targetUsers = new List<ApplicationUser>();

        switch (dto.TargetType.ToLower())
        {
            case "all":
                targetUsers = await _userManager.Users.ToListAsync();
                break;
            case "students":
                var students = await _userManager.GetUsersInRoleAsync("Student");
                targetUsers = students.ToList();
                break;
            case "teachers":
                var teachers = await _userManager.GetUsersInRoleAsync("Teacher");
                targetUsers = teachers.ToList();
                break;
            case "users": // Multiple specific users
            case "user":  // Legacy support
            case "single":
                if (dto.TargetIds != null && dto.TargetIds.Any())
                {
                    foreach (var id in dto.TargetIds)
                    {
                        var user = await _userManager.FindByIdAsync(id);
                        if (user != null) targetUsers.Add(user);
                    }
                }
                else if (!string.IsNullOrEmpty(dto.TargetId))
                {
                     var user = await _userManager.FindByIdAsync(dto.TargetId);
                     if (user != null) targetUsers.Add(user);
                }
                else
                {
                    return BadRequest("TargetIds or TargetId is required for specific users.");
                }
                break;
            default:
                return BadRequest("Invalid TargetType. Use 'All', 'Students', 'Teachers', or 'Users'.");
        }

        if (!targetUsers.Any()) return Ok(new { message = "No users found for the specified target." });

        var notifications = new List<Notification>();

        foreach (var user in targetUsers)
        {
            var notification = new Notification
            {
                UserId = user.Id,
                Title = dto.Title,
                Message = dto.Message,
                Type = "System", // System Broadcast
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };
            notifications.Add(notification);
        }

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();

        // Send Real-time via SignalR using Task.WhenAll for concurrent sends
        var signalRTasks = notifications.Select(n =>
            _hubContext.Clients.Group(n.UserId).SendAsync("ReceiveNotification", new 
            {
                n.Id,
                n.Title,
                n.Message,
                n.Type,
                n.CreatedAt,
                n.IsRead
            })
        );
        await Task.WhenAll(signalRTasks);

        return Ok(new { message = $"Notification sent to {notifications.Count} users." });
    }
}

public class SendNotificationDto
{
    public string TargetType { get; set; } = "User"; // All, Students, Teachers, Users
    public string? TargetId { get; set; } // Legacy single ID
    public List<string>? TargetIds { get; set; } // New multiple IDs
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
