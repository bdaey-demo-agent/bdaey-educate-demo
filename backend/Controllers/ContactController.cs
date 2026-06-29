using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ContactController(ApplicationDbContext context)
    {
        _context = context;
    }

    // POST: api/contact
    [HttpPost]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("contact")]
    public async Task<IActionResult> SendMessage([FromBody] ContactDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var message = new ContactMessage
        {
            Name = dto.Name,
            Email = dto.Email,
            Reason = dto.Reason ?? "General",
            Subject = dto.Subject,
            Message = dto.Message
        };

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Message sent successfully" });
    }

    // GET: api/contact
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<ContactMessage>>> GetMessages()
    {
        return await _context.ContactMessages
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    // PUT: api/contact/{id}/read
    [HttpPut("{id}/read")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null) return NotFound();

        message.IsRead = true;
        await _context.SaveChangesAsync();
        
        return NoContent();
    }
}

public class ContactDto
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? Reason { get; set; }
    public string? Subject { get; set; }
    public required string Message { get; set; }
}
