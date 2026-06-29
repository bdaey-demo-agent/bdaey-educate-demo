using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public ChatController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
    {
        try
        {
            var senderId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (senderId == null) return Unauthorized();

            // 1. Validate Receiver
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);
            if (receiver == null) return NotFound("Receiver not found");

            // 0. CHECK PERMISSION: Must have a CONFIRMED booking
            var hasBooking = await _context.Bookings
                .Include(b => b.TeacherProfile)
                .AnyAsync(b => 
                    b.Status == BookingStatus.Confirmed && 
                    ((b.StudentId == senderId && b.TeacherProfile!.UserId == dto.ReceiverId) ||
                     (b.StudentId == dto.ReceiverId && b.TeacherProfile!.UserId == senderId))
                );
                
            if (!hasBooking)
            {
                return BadRequest("You can only message users with whom you have a confirmed booking.");
            }

            // 2. Create Message
            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                Content = dto.Content,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync(); 

            // 3. Enforce 100 Message Limit (Rotation) - Use DB-level Take/OrderBy
            var totalCount = await _context.ChatMessages
                .CountAsync(m => (m.SenderId == senderId && m.ReceiverId == dto.ReceiverId) ||
                                 (m.SenderId == dto.ReceiverId && m.ReceiverId == senderId));

            if (totalCount > 100)
            {
                var toDelete = await _context.ChatMessages
                    .Where(m => (m.SenderId == senderId && m.ReceiverId == dto.ReceiverId) ||
                                (m.SenderId == dto.ReceiverId && m.ReceiverId == senderId))
                    .OrderBy(m => m.SentAt)
                    .Take(totalCount - 100)
                    .ToListAsync();

                _context.ChatMessages.RemoveRange(toDelete);
                await _context.SaveChangesAsync();
            }

            // 4. Send Real-time Notification
            var senderName = User.FindFirstValue("FullName") ?? "User";
            var messageDto = new ChatMessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = senderName,
                ReceiverId = message.ReceiverId,
                Content = message.Content,
                SentAt = message.SentAt,
                IsRead = message.IsRead,
                IsMe = false
            };

            await _hubContext.Clients.Group(dto.ReceiverId).SendAsync("ReceiveMessage", messageDto);

            return Ok(new ChatMessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = senderName,
                ReceiverId = message.ReceiverId,
                Content = message.Content,
                SentAt = message.SentAt,
                IsRead = message.IsRead,
                IsMe = true
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while sending the message.", detail = ex.Message });
        }
    }

    [HttpGet("history/{userId}")]
    public async Task<ActionResult<IEnumerable<ChatMessageDto>>> GetHistory(string userId)
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var messages = await _context.ChatMessages
                .Where(m => (m.SenderId == currentUserId && m.ReceiverId == userId) ||
                            (m.SenderId == userId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.SentAt)
                .Select(m => new ChatMessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.Sender!.FullName,
                    ReceiverId = m.ReceiverId,
                    Content = m.Content,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead,
                    IsMe = m.SenderId == currentUserId
                })
                .ToListAsync();

            return Ok(messages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching history.", detail = ex.Message });
        }
    }

    [HttpGet("contacts")]
    public async Task<ActionResult<IEnumerable<object>>> GetContacts()
    {
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            // Find active contacts via CONFIRMED Bookings
            
            // 1. If I am a Student: Get Teachers
            var teacherContacts = await _context.Bookings
                .Where(b => b.StudentId == currentUserId && b.Status == BookingStatus.Confirmed)
                .Select(b => new 
                {
                    UserId = b.TeacherProfile!.UserId,
                    FullName = b.TeacherProfile.User!.FullName,
                    ProfilePictureUrl = b.TeacherProfile.User.ProfilePictureUrl,
                    BookingId = b.Id
                })
                .ToListAsync();

            // 2. If I am a Teacher: Get Students
            var studentContacts = await _context.Bookings
                .Where(b => b.TeacherProfile!.UserId == currentUserId && b.Status == BookingStatus.Confirmed)
                .Select(b => new
                {
                    UserId = b.StudentId,
                    FullName = b.Student!.FullName,
                    ProfilePictureUrl = b.Student.ProfilePictureUrl,
                    BookingId = b.Id
                })
                .ToListAsync();
                
            var allContacts = teacherContacts.Concat(studentContacts).DistinctBy(u => u.UserId).ToList();
            
            // 3. For each contact, find the NEXT session
            var result = new List<object>();
            
            foreach (var contact in allContacts)
            {
                var nextSession = await _context.Sessions
                    .Where(s => s.Status == SessionStatus.Scheduled && s.ScheduledAt > DateTime.UtcNow)
                    .Where(s => (s.StudentId == currentUserId && s.TeacherProfile!.UserId == contact.UserId) ||
                                (s.StudentId == contact.UserId && s.TeacherProfile!.UserId == currentUserId))
                    .OrderBy(s => s.ScheduledAt)
                    .FirstOrDefaultAsync();

                result.Add(new 
                {
                    Id = contact.UserId,
                    FullName = contact.FullName,
                    ProfilePictureUrl = contact.ProfilePictureUrl,
                    NextSessionDate = nextSession?.ScheduledAt
                });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while fetching contacts.", detail = ex.Message });
        }
    }
}
