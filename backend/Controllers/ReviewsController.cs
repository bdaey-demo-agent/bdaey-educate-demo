using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<ReviewDto>> AddReview([FromBody] CreateReviewDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var review = await _reviewService.AddReviewAsync(userId, dto);
            return Ok(review);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("teacher/{teacherId}")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetTeacherReviews(int teacherId)
    {
        var reviews = await _reviewService.GetTeacherReviewsAsync(teacherId);
        return Ok(reviews);
    }
}
