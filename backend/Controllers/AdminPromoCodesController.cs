using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;

namespace BdaeyEducat.API.Controllers;

[Route("api/admin/promo-codes")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminPromoCodesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public AdminPromoCodesController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // GET: api/admin/promo-codes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PromoCodeResponseDto>>> GetPromoCodes()
    {
        var codes = await _context.PromoCodes
            .Include(p => p.Usages)
                .ThenInclude(u => u.User)
            .OrderByDescending(p => p.Id)
            .ToListAsync();

        return Ok(_mapper.Map<IEnumerable<PromoCodeResponseDto>>(codes));
    }

    // POST: api/admin/promo-codes
    [HttpPost]
    public async Task<ActionResult<PromoCodeResponseDto>> CreatePromoCode([FromBody] PromoCodeCreateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Check if code already exists
        if (await _context.PromoCodes.AnyAsync(p => p.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(new { message = "Promo code already exists." });
        }

        var promoCode = _mapper.Map<PromoCode>(dto);
        promoCode.Code = promoCode.Code.ToUpperInvariant(); // Standardize to uppercase

        _context.PromoCodes.Add(promoCode);
        await _context.SaveChangesAsync();

        var responseDto = _mapper.Map<PromoCodeResponseDto>(promoCode);
        return CreatedAtAction(nameof(GetPromoCodes), new { id = promoCode.Id }, responseDto);
    }

    // PUT: api/admin/promo-codes/{id}/toggle
    [HttpPut("{id}/toggle")]
    public async Task<IActionResult> TogglePromoCodeStatus(int id)
    {
        var promoCode = await _context.PromoCodes.FindAsync(id);
        if (promoCode == null) return NotFound("Promo code not found");

        promoCode.IsActive = !promoCode.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Promo code status changed to {(promoCode.IsActive ? "Active" : "Inactive")}" });
    }

    // DELETE: api/admin/promo-codes/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePromoCode(int id)
    {
        var promoCode = await _context.PromoCodes.FindAsync(id);
        if (promoCode == null) return NotFound("Promo code not found.");

        if (promoCode.CurrentUses > 0)
        {
            return BadRequest(new { message = "Cannot delete a promo code that has already been used. Please disable it instead." });
        }

        _context.PromoCodes.Remove(promoCode);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
