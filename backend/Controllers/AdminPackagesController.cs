using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Services;
using BdaeyEducat.API.Dtos;
using System.Security.Claims;
using BdaeyEducat.API.Data.Enums;

namespace BdaeyEducat.API.Controllers
{
    [Route("api/admin/packages")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminPackagesController : ControllerBase
    {
        private readonly IPackageService _packageService;

        public AdminPackagesController(IPackageService packageService)
        {
            _packageService = packageService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<AdminPackageDto>>> GetPackages([FromQuery] AdminPackageFilterDto filter)
        {
            var result = await _packageService.GetAdminPackagesAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AdminPackageDetailDto>> GetPackage(int id)
        {
            try
            {
                var result = await _packageService.GetAdminPackageDetailAsync(id);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePackageStatusDto dto)
        {
            try
            {
                var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                await _packageService.UpdatePackageStatusAsync(id, adminId!, dto);
                return NoContent();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePackage(int id)
        {
            try
            {
                // Strict Hard Delete
                await _packageService.HardDeletePackageAsync(id);
                return NoContent();
            }
            catch (ArgumentException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) 
            { 
                 // Conflict: Has bookings
                 return Conflict(new { message = ex.Message }); 
            }
            catch (Exception ex) { return BadRequest(ex.Message); }
        }
    }
}
