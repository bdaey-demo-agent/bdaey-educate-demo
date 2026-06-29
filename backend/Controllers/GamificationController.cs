using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Dtos;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamificationController : ControllerBase
{
    private readonly IGamificationService _gamificationService;

    public GamificationController(IGamificationService gamificationService)
    {
        _gamificationService = gamificationService;
    }

    [HttpGet("student/profile")]
    [Authorize]
    public async Task<ActionResult<StudentGamificationProfileDto>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var profile = await _gamificationService.GetStudentProfileAsync(userId);
        return Ok(profile);
    }

    [HttpGet("leaderboard")]
    [Authorize]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetLeaderboard()
    {
        // Publicly viewable or student-only? The prompt implies students should see it.
        // We can make it accessible to logged-in users.
        var leaderboard = await _gamificationService.GetLeaderboardAsync(10);
        return Ok(leaderboard);
    }
}
