using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PackagesController : ControllerBase
{
    private readonly IPackageService _packageService;
    private readonly Microsoft.Extensions.Logging.ILogger<PackagesController> _logger;

    public PackagesController(IPackageService packageService, Microsoft.Extensions.Logging.ILogger<PackagesController> logger)
    {
        _packageService = packageService;
        _logger = logger;
    }

    [HttpGet("teacher/{teacherId}")]
    public async Task<ActionResult<IEnumerable<PackageDto>>> GetTeacherPackages(int teacherId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAdmin = User.IsInRole("Admin");
        bool isTeacherAndOwner = false;
        
        if (User.IsInRole("Teacher"))
        {
            if (userId == null) return Unauthorized();
            var teacherProfile = await _packageService.GetTeacherProfileByUserId(userId);
            if (teacherProfile != null && teacherProfile.Id == teacherId)
            {
                isTeacherAndOwner = true;
            }
        }

        bool includeArchived = isAdmin || isTeacherAndOwner;
        
        var packages = await _packageService.GetTeacherPackagesAsync(teacherId, userId, includeArchived);
        return Ok(packages);
    }

    [HttpGet("{id}/slots")]
    public async Task<ActionResult<IEnumerable<DateTime>>> GetAvailableSlots(int id, [FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var slots = await _packageService.GetAvailableSlotsAsync(id, start, end, userId);
            return Ok(slots);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{id}/my-slots")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<IEnumerable<DateTime>>> GetMyPackageSlots(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var slots = await _packageService.GetMyPackageSlotsAsync(id, userId);
        return Ok(slots);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<PackageDto>> CreatePackage([FromBody] CreatePackageDto dto)
    {
        try 
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            var package = await _packageService.CreatePackageAsync(userId, dto, isAdmin);
            return CreatedAtAction(nameof(GetTeacherPackages), new { teacherId = package.TeacherProfileId }, package);
        }
        catch (UnauthorizedAccessException) { return NotFound("Teacher profile not found"); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (Exception ex) { return BadRequest($"CRITICAL ERROR: {ex.Message}"); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> UpdatePackage(int id, [FromBody] CreatePackageDto dto)
    {
        _logger.LogInformation("[DEBUG] PackagesController.UpdatePackage hit for ID {id}", id);
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            var package = await _packageService.UpdatePackageAsync(id, userId, dto, isAdmin);
            return Ok(package);
        }
        catch (ArgumentException) { return NotFound("Package not found"); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); } // Conflict or Pending Bookings
        catch (Exception ex) { return BadRequest($"CRITICAL ERROR: {ex.Message}"); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> DeletePackage(int id, [FromQuery] bool applyPenalty = true)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            
            // If Teacher is deleting, FORCE penalty (ignore param). 
            // If Admin is deleting, respect the param.
            bool finalApplyPenalty = isAdmin ? applyPenalty : true;

            await _packageService.DeletePackageAsync(id, userId, isAdmin, finalApplyPenalty);
            return NoContent();
        }
        catch (ArgumentException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPost("{id}/restore")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<PackageDto>> RestorePackage(int id, [FromBody] RestorePackageRequest request)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            bool isAdmin = User.IsInRole("Admin");
            var restoredPackage = await _packageService.RestorePackageAsync(id, userId, request?.StartDate, isAdmin);
            return Ok(restoredPackage);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Server error while restoring the package." });
        }
    }
}

public class RestorePackageRequest
{
    public DateTimeOffset? StartDate { get; set; }
}
