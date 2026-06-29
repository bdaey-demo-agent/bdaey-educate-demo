using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using BdaeyEducat.API.Services;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TeachersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IS3FileService _s3Service;
    private readonly IMemoryCache _cache;
    private readonly ILogger<TeachersController> _logger;

    public TeachersController(ApplicationDbContext context, IMapper mapper, IS3FileService s3Service, IMemoryCache cache, ILogger<TeachersController> logger)
    {
        _context = context;
        _mapper = mapper;
        _s3Service = s3Service;
        _cache = cache;
        _logger = logger;
    }

    // GET: api/teachers
    [HttpGet]
    public async Task<ActionResult> GetTeachers(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20, 
        [FromQuery] string? search = null, 
        [FromQuery] string? category = null,
        [FromQuery] string? gender = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] bool? isOnline = null,
        [FromQuery] double? minRating = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool favoritesOnly = false)
    {
        var cacheKey = "ApprovedTeachersList";
        if (!_cache.TryGetValue(cacheKey, out List<TeacherProfileResponseDto>? teacherDtos))
        {
            var teachers = await _context.TeacherProfiles
                .Include(t => t.User)
                .Include(t => t.Packages)
                .Where(t => t.Status == TeacherStatus.Approved)
                .AsNoTracking()
                .ToListAsync();

            teacherDtos = _mapper.Map<List<TeacherProfileResponseDto>>(teachers);

            var studentCounts = await _context.Bookings
                .Where(b => b.Status != BdaeyEducat.API.Data.Entities.BookingStatus.Cancelled)
                .GroupBy(b => b.TeacherProfileId)
                .Select(g => new { TeacherProfileId = g.Key, Count = g.Select(x => x.StudentId).Distinct().Count() })
                .ToDictionaryAsync(x => x.TeacherProfileId, x => x.Count);

            foreach (var dto in teacherDtos)
            {
                if (studentCounts.TryGetValue(dto.Id, out int count))
                {
                    dto.StudentCount = count;
                }
            }

            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

            _cache.Set(cacheKey, teacherDtos, cacheEntryOptions);
        }

        // Apply in-memory filtering (Blazing fast)
        var filteredTeachers = teacherDtos!.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.ToLowerInvariant();
            filteredTeachers = filteredTeachers.Where(t => 
                t.Name.ToLowerInvariant().Contains(searchTerm) || 
                (t.Subjects != null && t.Subjects.Any(s => s.ToLowerInvariant().Contains(searchTerm)))
            );
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "الكل")
        {
            var cat = category.ToLowerInvariant();
            filteredTeachers = filteredTeachers.Where(t => 
                t.Subjects != null && t.Subjects.Any(s => s.ToLowerInvariant().Contains(cat))
            );
        }

        if (!string.IsNullOrWhiteSpace(gender))
        {
            filteredTeachers = filteredTeachers.Where(t => 
                string.Equals(t.Gender, gender, StringComparison.OrdinalIgnoreCase)
            );
        }

        if (minPrice.HasValue)
        {
            filteredTeachers = filteredTeachers.Where(t => (t.MinPackagePrice ?? t.PriceStart) >= minPrice.Value);
        }

        if (maxPrice.HasValue)
        {
            filteredTeachers = filteredTeachers.Where(t => (t.MinPackagePrice ?? t.PriceStart) <= maxPrice.Value);
        }

        if (isOnline.HasValue && isOnline.Value)
        {
            filteredTeachers = filteredTeachers.Where(t => t.IsOnline);
        }

        if (minRating.HasValue)
        {
            filteredTeachers = filteredTeachers.Where(t => t.Rating >= minRating.Value);
        }

        if (favoritesOnly)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var favoriteIds = await _context.FavoriteTeachers
                    .Where(f => f.UserId == userId)
                    .Select(f => f.TeacherProfileId)
                    .ToListAsync();

                filteredTeachers = filteredTeachers.Where(t => favoriteIds.Contains(t.Id));
            }
            else
            {
                // If requested favorites but not logged in, return empty
                filteredTeachers = Enumerable.Empty<TeacherProfileResponseDto>();
            }
        }

        // Apply Sorting
        if (!string.IsNullOrWhiteSpace(sortBy))
        {
            filteredTeachers = sortBy.ToLowerInvariant() switch
            {
                // Prioritize HasPackages, then Online, then Rating
                "rating" => filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenByDescending(t => t.Rating),
                "price_asc" => filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenBy(t => t.MinPackagePrice ?? t.PriceStart),
                "price_desc" => filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenByDescending(t => t.MinPackagePrice ?? t.PriceStart),
                "requests" => filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenByDescending(t => t.ReviewCount),
                _ => filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenByDescending(t => t.Rating) 
            };
        }
        else
        {
            // Default: Prioritize HasPackages, then Online, then Rating
            filteredTeachers = filteredTeachers.OrderByDescending(t => t.MinPackagePrice != null).ThenByDescending(t => t.IsOnline).ThenByDescending(t => t.Rating);
        }

        var filteredList = filteredTeachers.ToList();
        var totalCount = filteredList.Count;
        
        var paginatedTeachers = filteredList
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new
        {
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            Data = paginatedTeachers
        });
    }

    // GET: api/teachers/me
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<TeacherProfileResponseDto>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var teacher = await _context.TeacherProfiles
            .Include(t => t.User)
            .Include(t => t.Packages)
            .AsNoTracking() // Ensure fresh data
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (teacher == null) return NotFound("Teacher profile not found");

        var responseDto = _mapper.Map<TeacherProfileResponseDto>(teacher);
        responseDto.StudentCount = await GetStudentCountAsync(teacher.Id);

        // Calculate Effective Penalty
        decimal penaltyAmount = 50m; // Default
        if (teacher.PackageDeletionPenalty.HasValue)
        {
            penaltyAmount = teacher.PackageDeletionPenalty.Value;
        }
        else
        {
            var penaltySetting = await _context.PlatformSettings.FindAsync("PackageDeletionPenalty");
            if (penaltySetting != null && decimal.TryParse(penaltySetting.Value, out var globalPenalty))
            {
                penaltyAmount = globalPenalty;
            }
        }
        responseDto.EffectivePackageDeletionPenalty = penaltyAmount;

        return Ok(responseDto);
    }

    // GET: api/teachers/my-students
    [HttpGet("my-students")]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult> GetMyStudents()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var teacherProfile = await _context.TeacherProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId);
        
        if (teacherProfile == null) return NotFound("Teacher profile not found");

        // Find students who have booked with this teacher
        var students = await _context.Bookings
            .Where(b => b.TeacherProfileId == teacherProfile.Id && 
                       (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending))
            .Include(b => b.Student)
            .Select(b => b.Student)
            .Distinct()
            .Select(s => new 
            {
                s!.Id,
                s.FullName,
                s.Email,
                JoinDate = s.CreatedAt
            })
            .ToListAsync();

        return Ok(students);
    }

    // GET: api/teachers/favorites
    [HttpGet("favorites")]
    [Authorize]
    public async Task<ActionResult<List<int>>> GetFavoriteTeacherIds()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var favoriteIds = await _context.FavoriteTeachers
            .Where(f => f.UserId == userId)
            .Select(f => f.TeacherProfileId)
            .ToListAsync();

        return Ok(favoriteIds);
    }

    // POST: api/teachers/{id}/favorite
    [HttpPost("{id}/favorite")]
    [Authorize]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var teacher = await _context.TeacherProfiles.FindAsync(id);
        if (teacher == null) return NotFound("Teacher not found");

        var favorite = await _context.FavoriteTeachers
            .FirstOrDefaultAsync(f => f.UserId == userId && f.TeacherProfileId == id);

        if (favorite != null)
        {
            _context.FavoriteTeachers.Remove(favorite);
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = false });
        }
        else
        {
            _context.FavoriteTeachers.Add(new FavoriteTeacher
            {
                UserId = userId,
                TeacherProfileId = id
            });
            await _context.SaveChangesAsync();
            return Ok(new { isFavorite = true });
        }
    }

    // GET: api/teachers/5
    [HttpGet("{id}")]
    public async Task<ActionResult<TeacherProfileResponseDto>> GetTeacher(int id)
    {
        var teacher = await _context.TeacherProfiles
            .Include(t => t.User)
            .Include(t => t.Packages)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (teacher == null)
        {
            return NotFound();
        }

        var responseDto = _mapper.Map<TeacherProfileResponseDto>(teacher);
        responseDto.StudentCount = await GetStudentCountAsync(teacher.Id);

        return Ok(responseDto);
    }

    // GET: api/teachers/user/{username}
    [HttpGet("user/{username}")]
    public async Task<ActionResult<TeacherProfileResponseDto>> GetTeacherByUsername(string username)
    {
        var teacher = await _context.TeacherProfiles
            .Include(t => t.User)
            .Include(t => t.Packages)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.User!.UserName == username);

        if (teacher == null)
        {
            return NotFound("Teacher not found");
        }

        var responseDto = _mapper.Map<TeacherProfileResponseDto>(teacher);
        responseDto.StudentCount = await GetStudentCountAsync(teacher.Id);

        return Ok(responseDto);
    }

    // GET: api/teachers/user-id/{userId}
    [HttpGet("user-id/{userId}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<TeacherProfileResponseDto>> GetTeacherByUserId(string userId)
    {
        var teacher = await _context.TeacherProfiles
            .Include(t => t.User)
            .Include(t => t.Packages)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (teacher == null)
        {
            return NotFound("Teacher not found");
        }

        var responseDto = _mapper.Map<TeacherProfileResponseDto>(teacher);
        responseDto.StudentCount = await GetStudentCountAsync(teacher.Id);

        return Ok(responseDto);
    }

    // POST: api/teachers
    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<TeacherProfileResponseDto>> CreateTeacherProfile([FromBody] CreateTeacherProfileDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Get current user ID from JWT token
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User not authenticated");
        }

        // Check if teacher profile already exists
        var existingProfile = await _context.TeacherProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId);

        if (existingProfile != null)
        {
            return Conflict("Teacher profile already exists for this user");
        }

        var teacherProfile = _mapper.Map<TeacherProfile>(dto);
        teacherProfile.UserId = userId;
        teacherProfile.IsDataSubmitted = true;

        _context.TeacherProfiles.Add(teacherProfile);
        await _context.SaveChangesAsync();

        // Reload with User data
        await _context.Entry(teacherProfile).Reference(t => t.User).LoadAsync();

        var responseDto = _mapper.Map<TeacherProfileResponseDto>(teacherProfile);
        return CreatedAtAction(nameof(GetTeacher), new { id = teacherProfile.Id }, responseDto);
    }

    // PUT: api/teachers/5
    [Authorize(Roles = "Teacher")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTeacherProfile(int id, [FromForm] UpdateTeacherProfileWithDocsDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var teacherProfile = await _context.TeacherProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

        if (teacherProfile == null) return NotFound("Teacher profile not found or you don't have permission");

        // Handle File Uploads with rollback tracking
        var uploadedKeys = new List<string>();
        try
        {
            if (dto.NationalIdImage != null && dto.NationalIdImage.Length > 0)
            {
                var objectKey = await _s3Service.UploadFileAsync(dto.NationalIdImage, $"users/{userId}/documents");
                uploadedKeys.Add(objectKey);
                teacherProfile.NationalIdImageUrl = $"/api/media/view/{objectKey}";
            }

            if (dto.IjazaCertificateImage != null && dto.IjazaCertificateImage.Length > 0)
            {
                var objectKey = await _s3Service.UploadFileAsync(dto.IjazaCertificateImage, $"users/{userId}/documents");
                uploadedKeys.Add(objectKey);
                teacherProfile.IjazaCertificateUrl = $"/api/media/view/{objectKey}";
            }

            if (dto.QualificationCertificateImage != null && dto.QualificationCertificateImage.Length > 0)
            {
                var objectKey = await _s3Service.UploadFileAsync(dto.QualificationCertificateImage, $"users/{userId}/documents");
                uploadedKeys.Add(objectKey);
                teacherProfile.QualificationCertificateUrl = $"/api/media/view/{objectKey}";
            }

            if (dto.ExperienceCertificateImage != null && dto.ExperienceCertificateImage.Length > 0)
            {
                var objectKey = await _s3Service.UploadFileAsync(dto.ExperienceCertificateImage, $"users/{userId}/documents");
                uploadedKeys.Add(objectKey);
                teacherProfile.ExperienceCertificateUrl = $"/api/media/view/{objectKey}";
            }

            if (dto.ProfilePictureImage != null && dto.ProfilePictureImage.Length > 0)
            {
                var objectKey = await _s3Service.UploadFileAsync(dto.ProfilePictureImage, $"users/{userId}/images");
                uploadedKeys.Add(objectKey);
                if (teacherProfile.User != null)
                {
                    teacherProfile.User.ProfilePictureUrl = $"/api/media/view/{objectKey}";
                }
            }
        }
        catch (Exception ex)
        {
            // Rollback uploaded S3 files on failure
            foreach (var key in uploadedKeys)
            {
                try { await _s3Service.DeleteFileAsync(key); } catch { }
            }
            return StatusCode(500, new { message = "S3 upload failed", details = ex.Message });
        }

        // Update User info (National ID & DOB)
        if (teacherProfile.User != null)
        {
            if (!string.IsNullOrEmpty(dto.NationalId)) 
            {
                teacherProfile.User.NationalId = dto.NationalId;
            }
            if (dto.DateOfBirth.HasValue) 
            {
                teacherProfile.User.DateOfBirth = dto.DateOfBirth.Value;
            }
        }

        // Map fields from DTO
        if (dto.Bio != null) teacherProfile.Bio = dto.Bio;
        if (dto.Title != null) teacherProfile.Title = dto.Title;
        if (dto.EducationDegree != null) teacherProfile.EducationDegree = dto.EducationDegree;
        if (dto.ExperienceYears != null) teacherProfile.ExperienceYears = dto.ExperienceYears;
        if (dto.IsHafiz.HasValue) teacherProfile.IsHafiz = dto.IsHafiz.Value;
        if (dto.HasIjaza.HasValue) teacherProfile.HasIjaza = dto.HasIjaza.Value;
        if (dto.IjazaType != null) teacherProfile.IjazaType = dto.IjazaType;
        if (dto.IjazaIssuer != null) teacherProfile.IjazaIssuer = dto.IjazaIssuer;
        if (dto.AudioSampleUrl != null) teacherProfile.AudioSampleUrl = dto.AudioSampleUrl;
        if (dto.ShowQualificationCertificate.HasValue) teacherProfile.ShowQualificationCertificate = dto.ShowQualificationCertificate.Value;
        if (dto.ShowExperienceCertificate.HasValue) teacherProfile.ShowExperienceCertificate = dto.ShowExperienceCertificate.Value;
        if (dto.ShowIjazaCertificate.HasValue) teacherProfile.ShowIjazaCertificate = dto.ShowIjazaCertificate.Value;
        if (dto.ShowAudioSample.HasValue) teacherProfile.ShowAudioSample = dto.ShowAudioSample.Value;
        
        // Handle Subjects
        if (dto.Subjects != null)
        {
            teacherProfile.Subjects = dto.Subjects;
        }

        // Handle ProfileSectionsOrder
        if (dto.ProfileSectionsOrder != null)
        {
            teacherProfile.ProfileSectionsOrder = dto.ProfileSectionsOrder;
        }
        
        teacherProfile.IsDataSubmitted = true;
        await _context.SaveChangesAsync();

        // Clear cache when a teacher updates their profile and they are likely approved
        _cache.Remove("ApprovedTeachersList");

        return NoContent();
    }


    // DELETE: api/teachers/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTeacherProfile(int id)
    {
        var teacherProfile = await _context.TeacherProfiles.FindAsync(id);
        if (teacherProfile == null)
        {
            return NotFound();
        }

        _context.TeacherProfiles.Remove(teacherProfile);
        await _context.SaveChangesAsync();

        return NoContent();
    }
    // POST: api/teachers/upload-audio
    [HttpPost("upload-audio")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UploadAudio([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        // Validate file type (mp3, wav, m4a)
        var allowedExtensions = new[] { ".mp3", ".wav", ".m4a" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            return BadRequest("Invalid file type. Only MP3, WAV, and M4A are allowed.");

        // MIME/magic-byte validation for audio files
        var headerBytes = new byte[12];
        using (var stream = file.OpenReadStream())
        {
            await stream.ReadExactlyAsync(headerBytes, 0, headerBytes.Length);
            stream.Position = 0;
        }

        bool isValidHeader = extension switch
        {
            ".mp3" => headerBytes[0] == 0xFF && (headerBytes[1] & 0xF0) == 0xF0 && headerBytes[1] != 0xFF,
            ".wav" => headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46 && headerBytes[8] == 0x57 && headerBytes[9] == 0x41 && headerBytes[10] == 0x56 && headerBytes[11] == 0x45,
            ".m4a" => (headerBytes[4] == 0x66 && headerBytes[5] == 0x74 && headerBytes[6] == 0x79 && headerBytes[7] == 0x70) || (headerBytes[0] == 0x00 && headerBytes[1] == 0x00 && headerBytes[2] == 0x00 && (headerBytes[3] & 0xF0) == 0x20),
            _ => false
        };

        if (!isValidHeader)
            return BadRequest("Audio file content does not match the declared extension.");

        // Validate file size (e.g. 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File size exceeds the limit of 10MB.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        var objectKey = await _s3Service.UploadFileAsync(file, $"users/{userId}/audio");
        var fileUrl = $"/api/media/view/{objectKey}";

        return Ok(new { url = fileUrl });
    }


    private void WriteLog(string message)
    {
        _logger.LogInformation("Teacher operation: {Message}", message);
    }

    private async Task<int> GetStudentCountAsync(int teacherProfileId)
    {
        return await _context.Bookings
            .Where(b => b.TeacherProfileId == teacherProfileId && b.Status != BdaeyEducat.API.Data.Entities.BookingStatus.Cancelled)
            .Select(b => b.StudentId)
            .Distinct()
            .CountAsync();
    }

    // GET: api/teachers/admin/pending
    [HttpGet("admin/pending")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<TeacherProfileResponseDto>>> GetPendingTeachers()
    {
        WriteLog("GetPendingTeachers called");
        var teachers = await _context.TeacherProfiles
            .Include(t => t.User)
            .Include(t => t.Packages)
            .Where(t => t.Status == TeacherStatus.Pending)
            .AsNoTracking()
            .ToListAsync();
            
        foreach (var t in teachers)
        {
            WriteLog($"Found Pending: ID={t.Id}, Name={t.User?.FullName}, Hafiz={t.IsHafiz}, IjazaUrl={t.IjazaCertificateUrl}, QualUrl={t.QualificationCertificateUrl}, ExpUrl={t.ExperienceCertificateUrl}");
        }

        var response = teachers.Select(t => new TeacherProfileResponseDto
        {
            Id = t.Id,
            UserId = t.UserId,
            Name = t.User?.FullName ?? string.Empty,
            Email = t.User?.Email ?? string.Empty,
            ProfilePictureUrl = t.User?.ProfilePictureUrl,
            Title = t.Title,
            Subjects = t.Subjects,
            Bio = t.Bio,
            PriceStart = t.PriceStart,
            Currency = t.Currency,
            Rating = t.AverageRating,
            ReviewCount = t.TotalReviews,
            EducationDegree = t.EducationDegree,
            HasIjaza = t.HasIjaza,
            IsHafiz = t.IsHafiz,
            IjazaType = t.IjazaType,
            IjazaIssuer = t.IjazaIssuer,
            ExperienceYears = t.ExperienceYears,
            AudioSampleUrl = t.AudioSampleUrl,
            SocialLinks = t.SocialLinks,
            Status = t.Status.ToString(),
            NationalIdImageUrl = t.NationalIdImageUrl,
            IjazaCertificateUrl = t.IjazaCertificateUrl,
            QualificationCertificateUrl = t.QualificationCertificateUrl,
            ExperienceCertificateUrl = t.ExperienceCertificateUrl,
            NationalId = t.User?.NationalId,
            DateOfBirth = t.User?.DateOfBirth,
            ProfileSectionsOrder = t.ProfileSectionsOrder,
            IsDataSubmitted = t.IsDataSubmitted
        }).ToList();

        return Ok(response);
    }

    // PUT: api/teachers/{id}/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateTeacherStatus(int id, [FromBody] UpdateTeacherStatusDto dto)
    {
        if (!Enum.TryParse<TeacherStatus>(dto.Status, true, out var newStatus))
        {
            return BadRequest("Invalid status. Values: Pending, Approved, Rejected");
        }

        var teacher = await _context.TeacherProfiles.FindAsync(id);
        if (teacher == null) return NotFound();

        teacher.Status = newStatus;
        teacher.IsApproved = (newStatus == TeacherStatus.Approved);
        if (teacher.IsApproved)
        {
            teacher.IsDataSubmitted = true;
        }
        await _context.SaveChangesAsync();

        // Clear cache since approval status changed
        _cache.Remove("ApprovedTeachersList");

        return NoContent();
    }
    // PUT: api/teachers/{id}/penalty
    [HttpPut("{id}/penalty")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateTeacherPenalty(int id, [FromBody] UpdateTeacherPenaltyDto dto)
    {
        var teacher = await _context.TeacherProfiles.FindAsync(id);
        if (teacher == null) return NotFound();

        teacher.PackageDeletionPenalty = dto.Penalty;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Penalty updated successfully", penalty = teacher.PackageDeletionPenalty });
    }
}

public class UpdateTeacherStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class UpdateTeacherPenaltyDto
{
    public decimal? Penalty { get; set; }
}
