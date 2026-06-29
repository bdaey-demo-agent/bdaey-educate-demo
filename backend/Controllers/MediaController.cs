using BdaeyEducat.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BdaeyEducat.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IS3FileService _s3Service;
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/webm",
        "application/pdf",
        "audio/mpeg", "audio/wav", "audio/mp4"
    };

    private const int MaxFilenameLength = 255;

    public MediaController(IS3FileService s3Service)
    {
        _s3Service = s3Service;
    }

    [HttpPost("presign-upload")]
    public IActionResult GetPresignedUploadUrl([FromBody] PresignUploadRequest req)
    {
        if (string.IsNullOrEmpty(req.FileName) || string.IsNullOrEmpty(req.ContentType))
            return BadRequest("FileName and ContentType are required.");

        if (req.FileName.Length > MaxFilenameLength)
            return BadRequest($"FileName exceeds maximum length of {MaxFilenameLength} characters.");

        if (!AllowedContentTypes.Contains(req.ContentType))
            return BadRequest($"ContentType '{req.ContentType}' is not allowed.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var extension = Path.GetExtension(req.FileName);
        var folder = req.ContentType.StartsWith("image/") ? "images" : "media";
        var key = $"users/{userId}/{folder}/{Guid.NewGuid()}{extension}";

        var url = _s3Service.GeneratePreSignedUploadUrl(key, req.ContentType);

        return Ok(new { uploadUrl = url, key = key });
    }

    [HttpGet("presign-view")]
    public IActionResult GetPresignedViewUrl([FromQuery] string key)
    {
        if (string.IsNullOrEmpty(key)) return BadRequest("Key is required.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (!key.StartsWith($"users/{userId}/", StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var url = _s3Service.GeneratePreSignedDownloadUrl(key);
        return Ok(new { viewUrl = url });
    }

    [HttpGet("view/{*key}")]
    public IActionResult ViewFile(string key)
    {
        if (string.IsNullOrEmpty(key)) return BadRequest("Key is required.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (!key.StartsWith($"users/{userId}/", StringComparison.OrdinalIgnoreCase) && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var url = _s3Service.GeneratePreSignedDownloadUrl(key);
        return Redirect(url);
    }
}

public class PresignUploadRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}
