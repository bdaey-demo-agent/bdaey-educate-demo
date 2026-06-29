using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FilesController : ControllerBase
{
    private readonly Services.IFileService _fileService;

    public FilesController(Services.IFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpPost("upload")]
    [Authorize]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("uploads")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.");

            // Magic-byte validation
            var headerBytes = new byte[8];
            using (var stream = file.OpenReadStream())
            {
                await stream.ReadExactlyAsync(headerBytes, 0, headerBytes.Length);
                stream.Position = 0;
            }

            bool isValidHeader = extension switch
            {
                ".jpg" or ".jpeg" => headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF,
                ".png" => headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47,
                ".gif" => headerBytes[0] == 0x47 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x38,
                ".webp" => headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46,
                _ => false
            };

            if (!isValidHeader)
                return BadRequest("File content does not match the declared extension.");

            // 5MB limit
            long sizeLimit = 5 * 1024 * 1024;
            if (file.Length > sizeLimit)
                return BadRequest("File size exceeds the 5MB limit.");

            // Generate GUID filename for path traversal prevention
            var guidName = $"{Guid.NewGuid()}{extension}";
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            ms.Position = 0;
            var renamedFile = new FormFile(ms, 0, ms.Length, "file", guidName);

            var url = await _fileService.UploadFileAsync(renamedFile, allowedExtensions, sizeLimit, "uploads");
            return Ok(new { Url = url });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
