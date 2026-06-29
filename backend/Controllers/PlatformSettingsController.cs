using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Controllers
{
    [Route("api/platform-settings")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class PlatformSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PlatformSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/platform-settings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PlatformSetting>>> GetSettings()
        {
            return await _context.PlatformSettings.ToListAsync();
        }

        // GET: api/platform-settings/{key}
        [HttpGet("{key}")]
        public async Task<ActionResult<PlatformSetting>> GetSetting(string key)
        {
            var setting = await _context.PlatformSettings.FindAsync(key);
            if (setting == null)
            {
                // Fallback for critical settings to avoid 404 noise in console
                if (key == "PackageDeletionPenalty")
                {
                    return Ok(new PlatformSetting { Key = key, Value = "50.0", Description = "Default Fallback" });
                }
                if (key == "GlobalCommission")
                {
                    return Ok(new PlatformSetting { Key = key, Value = "15.0", Description = "Default Fallback" });
                }
                return NotFound();
            }
            return setting;
        }

        // POST: api/platform-settings
        [HttpPost]
        public async Task<ActionResult<PlatformSetting>> CreateOrUpdateSetting([FromBody] UpsertPlatformSettingDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var existing = await _context.PlatformSettings.FindAsync(dto.Key);
            if (existing != null)
            {
                existing.Value = dto.Value;
                existing.Description = dto.Description ?? existing.Description;
                _context.PlatformSettings.Update(existing);
            }
            else
            {
                _context.PlatformSettings.Add(new PlatformSetting
                {
                    Key = dto.Key,
                    Value = dto.Value,
                    Description = dto.Description
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { dto.Key, dto.Value, dto.Description });
        }
    }

    public class UpsertPlatformSettingDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
