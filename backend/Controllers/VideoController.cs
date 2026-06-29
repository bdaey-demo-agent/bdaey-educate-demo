using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BdaeyEducat.API.Services.Video;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class VideoController : ControllerBase
{
    private readonly VideoService _videoService;

    public VideoController(VideoService videoService)
    {
        _videoService = videoService;
    }

    [HttpPost("sessions/{sessionId}/prepare")]
    public async Task<IActionResult> PrepareRoom(int sessionId)
    {
        try
        {
            // Authorization check: User must be teacher of this session or Admin
            // (Handled inside VideoService for consistency, but we could add explicit checks here)
            var roomInfo = await _videoService.PrepareSessionAsync(sessionId);
            return Ok(roomInfo);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("sessions/{sessionId}/join")]
    public async Task<IActionResult> JoinRoom(int sessionId)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            string? connectionId = Request.Query["connectionId"];
            var joinInfo = await _videoService.GetJoinInfoAsync(sessionId, userId, connectionId);
            
            // Return provider info so frontend knows which SDK to use
            return Ok(new {
                provider = "daily", // Should be dynamic in full implementation
                roomUrl = joinInfo.RoomUrl,
                token = joinInfo.Token,
                displayName = joinInfo.DisplayName,
                // Add schedule info for frontend validation
                scheduledAt = joinInfo.ScheduledAt,
                durationMinutes = joinInfo.DurationMinutes,
                studentId = joinInfo.StudentId
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
