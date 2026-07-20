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
    private readonly ILogger<VideoController> _logger;

    public VideoController(VideoService videoService, ILogger<VideoController> logger)
    {
        _videoService = videoService;
        _logger = logger;
    }

    [HttpPost("sessions/{sessionId}/prepare")]
    public async Task<IActionResult> PrepareRoom(int sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        try
        {
            var roomInfo = await _videoService.PrepareSessionAsync(
                sessionId,
                userId,
                User.IsInRole("Admin"));
            return Ok(roomInfo);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Session not found." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to prepare video room for session {SessionId}", sessionId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Unable to prepare the session room." });
        }
    }

    [HttpGet("sessions/{sessionId}/join")]
    public async Task<IActionResult> JoinRoom(int sessionId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        try
        {
            string? connectionId = Request.Query["connectionId"];
            var joinInfo = await _videoService.GetJoinInfoAsync(
                sessionId,
                userId,
                connectionId,
                User.IsInRole("Admin"));

            return Ok(new
            {
                provider = "daily",
                roomUrl = joinInfo.RoomUrl,
                token = joinInfo.Token,
                displayName = joinInfo.DisplayName,
                scheduledAt = joinInfo.ScheduledAt,
                durationMinutes = joinInfo.DurationMinutes,
                studentId = joinInfo.StudentId
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Session or user not found." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to join video room for session {SessionId}", sessionId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Unable to join the session room." });
        }
    }
}
