using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionEvaluationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IGamificationService _gamificationService;
    private readonly IConfiguration _configuration;

    public SessionEvaluationsController(ApplicationDbContext context, IMapper mapper, IGamificationService gamificationService, IConfiguration configuration)
    {
        _context = context;
        _mapper = mapper;
        _gamificationService = gamificationService;
        _configuration = configuration;
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> CreateEvaluation([FromBody] SessionEvaluationCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // Find teacher profile
        var teacherProfile = await _context.TeacherProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId);
            
        if (teacherProfile == null)
            return Unauthorized("Teacher profile not found");

        // Validate session
        var session = await _context.Sessions
            .Include(s => s.Booking)
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId && s.TeacherProfileId == teacherProfile.Id);

        if (session == null)
            return NotFound("Session not found or you are not authorized to evaluate it.");

        // Check if already evaluated
        var existingEval = await _context.SessionEvaluations
            .FirstOrDefaultAsync(e => e.SessionId == session.Id);
            
        if (existingEval != null)
            return BadRequest("Session has already been evaluated.");

        var evaluation = _mapper.Map<SessionEvaluation>(dto);
        evaluation.TeacherProfileId = teacherProfile.Id;

        _context.SessionEvaluations.Add(evaluation);

        // Complete the session if not already completed
        if (session.Status != SessionStatus.Completed)
        {
            session.Status = SessionStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;

            // Mark booking as completed if all sessions are completed
            if (session.Booking != null)
            {
                var allSessions = await _context.Sessions
                    .Where(s => s.BookingId == session.BookingId)
                    .ToListAsync();
                
                if (allSessions.All(s => s.Id == session.Id || s.Status == SessionStatus.Completed))
                {
                    session.Booking.Status = BookingStatus.Completed;
                }
            }
        }

        await _context.SaveChangesAsync();

        // Award Points - read from configuration
        int basePoints = _configuration.GetValue<int>("Evaluation:BasePoints", 10);
        int scoreMultiplier = _configuration.GetValue<int>("Evaluation:ScoreMultiplier", 10);
        int pointsToAward = basePoints + (dto.EvaluationScore * scoreMultiplier);
        await _gamificationService.AwardPointsAsync(evaluation.StudentId, pointsToAward);

        var responseDto = _mapper.Map<SessionEvaluationResponseDto>(evaluation);
        return CreatedAtAction(nameof(GetEvaluation), new { id = evaluation.Id }, responseDto);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<SessionEvaluationResponseDto>> GetEvaluation(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        var evaluation = await _context.SessionEvaluations
            .Include(e => e.Student)
            .Include(e => e.TeacherProfile)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (evaluation == null)
            return NotFound();

        // Security check: Only Admin, the respective Teacher, or the respective Student can view this.
        if (role != "Admin" && 
            evaluation.StudentId != userId && 
            evaluation.TeacherProfile?.UserId != userId)
        {
            return Forbid();
        }

        return Ok(_mapper.Map<SessionEvaluationResponseDto>(evaluation));
    }

    [HttpGet("student/{studentId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<SessionEvaluationResponseDto>>> GetStudentEvaluations(string studentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var role = User.FindFirstValue(ClaimTypes.Role);

        // Security check: Only Admin or the respective Student can view their full progress list.
        if (role != "Admin" && studentId != userId)
        {
            // Or maybe Parent in the future
            return Forbid();
        }

        var evaluations = await _context.SessionEvaluations
            .Include(e => e.TeacherProfile)
                .ThenInclude(t => t!.User)
            .Where(e => e.StudentId == studentId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<SessionEvaluationResponseDto>>(evaluations));
    }
}
