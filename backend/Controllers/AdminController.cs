using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _configuration;

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IMemoryCache cache, IConfiguration configuration)
    {
        _context = context;
        _userManager = userManager;
        _cache = cache;
        _configuration = configuration;
    }

    // 1. Dashboard Stats
    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        try
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var totalStudents = (await _userManager.GetUsersInRoleAsync("Student")).Count;
            
            var totalTeachers = await _context.TeacherProfiles.CountAsync();
            var pendingTeachers = await _context.TeacherProfiles.CountAsync(t => !t.IsApproved);
            
            var totalBookings = await _context.Bookings.CountAsync();
            var completedBookings = await _context.Bookings.CountAsync(b => b.Status == BookingStatus.Completed);
            var cancelledBookings = await _context.Bookings.CountAsync(b => b.Status == BookingStatus.Cancelled);
            
            var totalRevenueVolume = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .SumAsync(b => b.TotalPrice);

            var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
            var newUsersLast7Days = await _userManager.Users.CountAsync(u => u.CreatedAt >= sevenDaysAgo);

            var pendingWithdrawals = await _context.WithdrawalRequests
                .Where(w => w.Status == WithdrawalStatus.Pending)
                .CountAsync();
            var pendingWithdrawalsAmount = await _context.WithdrawalRequests
                .Where(w => w.Status == WithdrawalStatus.Pending)
                .SumAsync(w => w.Amount);

            var completedSessions = await _context.Sessions
                .CountAsync(s => s.Status == SessionStatus.Completed);

            return Ok(new 
            {
                TotalUsers = totalUsers,
                ActiveUsersCount = BdaeyEducat.API.Hubs.NotificationHub.GetActiveUsersCount(),
                TotalStudents = totalStudents,
                TotalTeachers = totalTeachers,
                PendingTeachers = pendingTeachers,
                TotalBookings = totalBookings,
                CompletedBookings = completedBookings,
                CancelledBookings = cancelledBookings,
                TotalVolume = totalRevenueVolume,
                NewUsersLast7Days = newUsersLast7Days,
                PendingWithdrawals = pendingWithdrawals,
                PendingWithdrawalsAmount = pendingWithdrawalsAmount,
                CompletedSessions = completedSessions
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred fetching stats.", detail = ex.Message });
        }
    }

    // 2. Global Settings (Commission)
    [HttpGet("settings/commission")]
    public async Task<ActionResult> GetGlobalCommission()
    {
        try
        {
            var setting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "GlobalCommission");
            decimal rate = 15.0m; // Default
            if (setting != null && decimal.TryParse(setting.Value, out var val))
            {
                rate = val;
            }
            return Ok(new { GlobalCommission = rate });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred fetching commission.", detail = ex.Message });
        }
    }

    [HttpPut("settings/commission")]
    public async Task<ActionResult> UpdateGlobalCommission([FromBody] UpdateCommissionDto dto)
    {
        try
        {
            if (dto.Rate < 0 || dto.Rate > 100) return BadRequest("Invalid rate");

            var setting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "GlobalCommission");
            if (setting == null)
            {
                setting = new PlatformSetting
                {
                    Key = "GlobalCommission",
                    Value = dto.Rate.ToString(),
                    Description = "System-wide default commission percentage"
                };
                _context.PlatformSettings.Add(setting);
            }
            else
            {
                setting.Value = dto.Rate.ToString();
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Global commission updated", GlobalCommission = dto.Rate });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred updating commission.", detail = ex.Message });
        }
    }

    public class CommissionUpdateRequest
    {
        public decimal? Rate { get; set; }
        public int? Duration { get; set; } // Optional: Number of Days or Months
        public string? Unit { get; set; } // "Days" or "Months"
    }

    public class UpdateCommissionDto
    {
        public decimal Rate { get; set; }
    }

    // 3. Teacher Commission Override
    [HttpPut("teachers/{id}/commission")]
    public async Task<ActionResult> SetTeacherCommission(int id, [FromBody] CommissionUpdateRequest request)
    {
        var teacher = await _context.TeacherProfiles.FindAsync(id);
        if (teacher == null) return NotFound();

        if (request.Rate.HasValue && (request.Rate.Value < 0 || request.Rate.Value > 100)) 
            return BadRequest("Invalid rate");

        // If rate is provided with duration, it's a scheduled temporary rate
        if (request.Rate.HasValue && request.Duration.HasValue && !string.IsNullOrEmpty(request.Unit))
        {
            teacher.ScheduledCommissionRate = request.Rate;
            if (request.Unit.Equals("Months", StringComparison.OrdinalIgnoreCase))
            {
                teacher.ScheduledCommissionUntil = DateTime.UtcNow.AddMonths(request.Duration.Value);
            }
            else // Default to Days
            {
                teacher.ScheduledCommissionUntil = DateTime.UtcNow.AddDays(request.Duration.Value);
            }
        }
        else
        {
            // Permanent Update (or reset)
            decimal? finalRate = request.Rate;

            // If rate matches global default, set to null (Use Default)
            var globalSetting = await _context.PlatformSettings.FirstOrDefaultAsync(s => s.Key == "GlobalCommission");
            if (globalSetting != null && decimal.TryParse(globalSetting.Value, out var globalRate))
            {
                if (finalRate.HasValue && finalRate.Value == globalRate)
                {
                    finalRate = null;
                }
            }
            else if (finalRate.HasValue && finalRate.Value == 15.0m)
            {
                finalRate = null;
            }

            teacher.CommissionRate = finalRate;
            // Also clear any active scheduled rate if setting permanent
            teacher.ScheduledCommissionRate = null;
            teacher.ScheduledCommissionUntil = null;
        }

        await _context.SaveChangesAsync();

        return Ok(new { 
            Message = "Commission updated", 
            Rate = teacher.CommissionRate,
            ScheduledRate = teacher.ScheduledCommissionRate,
            ScheduledUntil = teacher.ScheduledCommissionUntil
        });
    }
    
    // 4. Get Teacher By Id
    [HttpGet("teachers/{id}")]
    public async Task<ActionResult> GetTeacherById(int id)
    {
        var t = await _context.TeacherProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(tp => tp.Id == id);

        if (t == null) return NotFound();

        return Ok(new 
        {
            t.Id,
            UserId = t.UserId,
            Name = t.User!.FullName,
            Email = t.User!.Email,
            PhoneNumber = t.User!.PhoneNumber,
            t.Title,
            t.IsApproved,
            Status = t.Status.ToString(),
            t.CommissionRate,
            t.ScheduledCommissionRate,
            t.ScheduledCommissionUntil,
            t.CreatedAt,
            t.EducationDegree,
            t.HasIjaza,
            t.IsHafiz,
            t.IjazaType,
            t.IjazaIssuer,
            t.ExperienceYears,
            t.Subjects,
            t.AudioSampleUrl,
            t.SocialLinks,
            t.Bio,
            t.PriceStart,
            t.Currency,
            NationalId = t.User!.NationalId,
            DateOfBirth = t.User!.DateOfBirth,
            t.NationalIdImageUrl,
            t.IjazaCertificateUrl,
            t.QualificationCertificateUrl,
            t.ExperienceCertificateUrl,
            t.ShowAudioSample,
            t.ShowQualificationCertificate,
            t.ShowExperienceCertificate,
            t.ShowIjazaCertificate,
            t.IsDataSubmitted,
            t.PackageDeletionPenalty,
            IsBlocked = t.User!.IsBlocked
        });
    }

    // 5. All Teachers (For Management)
    [HttpGet("teachers")]
    public async Task<ActionResult> GetAllTeachers()
    {
         var teachers = await _context.TeacherProfiles
            .Include(t => t.User)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new 
            {
                t.Id,
                UserId = t.UserId,
                Name = t.User!.FullName,
                Email = t.User!.Email,
                PhoneNumber = t.User!.PhoneNumber,
                t.Title,
                t.IsApproved,
                Status = t.Status.ToString(),
                t.CommissionRate,
                t.ScheduledCommissionRate,
                t.ScheduledCommissionUntil,
                t.CreatedAt,
                // Full Profile Details
                t.EducationDegree,
                t.HasIjaza,
                t.IsHafiz,
                t.IjazaType,
                t.IjazaIssuer,
                t.ExperienceYears,
                t.Subjects,
                t.AudioSampleUrl,
                t.SocialLinks,
                t.Bio,
                t.PriceStart,
                t.Currency,
                // Critical Fields
                NationalId = t.User!.NationalId,
                DateOfBirth = t.User!.DateOfBirth,
                t.NationalIdImageUrl,
                t.IjazaCertificateUrl,
                t.QualificationCertificateUrl,
                t.ExperienceCertificateUrl,
                t.ShowAudioSample,
                t.ShowQualificationCertificate,
                t.ShowExperienceCertificate,
                t.ShowIjazaCertificate,
                t.IsDataSubmitted,
                IsBlocked = t.User!.IsBlocked
            })
            .ToListAsync();
            
        return Ok(teachers);
    }

    // 5. Pending Approvals
    [HttpGet("teachers/pending")]
    public async Task<ActionResult> GetPendingTeachers()
    {
         var teachers = await _context.TeacherProfiles
            .Include(t => t.User)
            .Where(t => !t.IsApproved)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new 
            {
                t.Id,
                UserId = t.UserId,
                Name = t.User!.FullName,
                Email = t.User!.Email,
                PhoneNumber = t.User!.PhoneNumber,
                t.Title,
                t.IsApproved,
                Status = t.Status.ToString(),
                t.CommissionRate,
                t.ScheduledCommissionRate,
                t.ScheduledCommissionUntil,
                t.CreatedAt,
                // Full Profile Details
                t.EducationDegree,
                t.HasIjaza,
                t.IsHafiz,
                t.IjazaType,
                t.IjazaIssuer,
                t.ExperienceYears,
                t.Subjects,
                t.AudioSampleUrl,
                t.SocialLinks,
                t.Bio,
                t.PriceStart,
                t.Currency,
                // Critical Fields
                NationalId = t.User!.NationalId,
                DateOfBirth = t.User!.DateOfBirth,
                t.NationalIdImageUrl,
                t.IjazaCertificateUrl,
                t.QualificationCertificateUrl,
                t.ExperienceCertificateUrl,
                t.IsDataSubmitted,
                IsBlocked = t.User!.IsBlocked
            })
            .ToListAsync();
            
        return Ok(teachers);
    }


    // 6. Student Management
    [HttpGet("students")]
    public async Task<ActionResult> GetStudents()
    {
        var students = await _userManager.GetUsersInRoleAsync("Student");
        
        var result = students.Select(u => new 
        {
            u.Id,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.CreatedAt, 
            IsBlocked = u.IsBlocked
        });
            
        return Ok(result);
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        // Prevent deleting the system administrator
        var adminEmail = _configuration["Admin:Email"] ?? string.Empty;
        if (!string.IsNullOrEmpty(adminEmail) && string.Equals(user.Email, adminEmail, StringComparison.OrdinalIgnoreCase))
            return BadRequest("لا يمكن حذف الأدمن المسؤول عن النظام.");

        // --- SAFEGUARD CHECKS ---

        // 1. Check wallet balance
        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == id);
        if (wallet != null && wallet.Balance > 0)
        {
            return BadRequest(new { code = "ActiveBalance", message = $"لا يمكن حذف هذا الحساب لأن لديه رصيداً في المحفظة ({wallet.Balance} {wallet.Currency}). يرجى تصفير الرصيد أو حظر الحساب بدلاً من ذلك." });
        }

        // 2. Check active bookings
        var activeBookingStatuses = new[] { BookingStatus.Pending, BookingStatus.Confirmed };
        var hasActiveBookings = await _context.Bookings
            .AnyAsync(b => (b.StudentId == id || b.TeacherProfile!.UserId == id) && activeBookingStatuses.Contains(b.Status));
        if (hasActiveBookings)
        {
            return BadRequest(new { code = "ActiveBookings", message = "لا يمكن حذف هذا الحساب لأن لديه حجوزات نشطة. يرجى إلغاء الحجوزات أو حظر الحساب بدلاً من ذلك." });
        }

        // 3. Check upcoming sessions
        var hasUpcomingSessions = await _context.Sessions
            .AnyAsync(s => (s.StudentId == id || s.TeacherProfile!.UserId == id) && s.ScheduledAt > DateTimeOffset.UtcNow && s.Status != SessionStatus.Completed && s.Status != SessionStatus.Cancelled);
        if (hasUpcomingSessions)
        {
            return BadRequest(new { code = "UpcomingSessions", message = "لا يمكن حذف هذا الحساب لأن لديه جلسات مجدولة قادمة. يرجى إلغاء الجلسات أو حظر الحساب بدلاً من ذلك." });
        }

        // --- DELETION ---

        // Delete Notifications
        var notifications = _context.Notifications.Where(n => n.UserId == id);
        _context.Notifications.RemoveRange(notifications);

        // Delete Chat Messages (sent and received)
        var chatMessages = _context.ChatMessages.Where(m => m.SenderId == id || m.ReceiverId == id);
        _context.ChatMessages.RemoveRange(chatMessages);

        // Delete Favorites
        var favorites = _context.FavoriteTeachers.Where(f => f.UserId == id);
        _context.FavoriteTeachers.RemoveRange(favorites);

        // Delete PromoCodeUsages
        var promoUsages = _context.PromoCodeUsages.Where(p => p.UserId == id);
        _context.PromoCodeUsages.RemoveRange(promoUsages);

        // Delete Reviews
        var reviews = _context.Reviews.Where(r => r.StudentId == id);
        _context.Reviews.RemoveRange(reviews);

        // Delete Student Badges
        var badges = _context.StudentBadges.Where(b => b.StudentId == id);
        _context.StudentBadges.RemoveRange(badges);

        // Delete Sessions and Bookings where user is Student
        var studentSessions = _context.Sessions.Where(s => s.StudentId == id);
        _context.Sessions.RemoveRange(studentSessions);
        var studentBookings = _context.Bookings.Where(b => b.StudentId == id);
        _context.Bookings.RemoveRange(studentBookings);

        // Delete Wallet Transactions and Wallet
        if (wallet != null)
        {
            var transactions = _context.WalletTransactions.Where(t => t.WalletId == wallet.Id);
            _context.WalletTransactions.RemoveRange(transactions);
            _context.Wallets.Remove(wallet);
        }

        // Delete TeacherProfile and its data
        var teacherProfile = await _context.TeacherProfiles.FirstOrDefaultAsync(t => t.UserId == id);
        if (teacherProfile != null)
        {
            // Delete all sessions and bookings related to this teacher profile
            var teacherSessions = _context.Sessions.Where(s => s.TeacherProfileId == teacherProfile.Id);
            _context.Sessions.RemoveRange(teacherSessions);
            var teacherBookings = _context.Bookings.Where(b => b.TeacherProfileId == teacherProfile.Id);
            _context.Bookings.RemoveRange(teacherBookings);

            // Remove FavoriteTeachers referencing this teacher profile
            var teacherFavs = _context.FavoriteTeachers.Where(f => f.TeacherProfileId == teacherProfile.Id);
            _context.FavoriteTeachers.RemoveRange(teacherFavs);
            
            _context.TeacherProfiles.Remove(teacherProfile);
        }

        await _context.SaveChangesAsync();

        // Clear Caches
        _cache.Remove("ApprovedTeachersList");
        _cache.Remove("SitemapXml");

        // Finally delete the user account
        var deleteResult = await _userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            return StatusCode(500, new { message = "فشل حذف الحساب. يرجى المحاولة لاحقاً." });
        }

        return Ok(new { message = "تم حذف الحساب بنجاح." });
    }

    // 8. One-time data fix for submission status
    [HttpPost("fix-submission-statuses")]
    public async Task<ActionResult> FixSubmissionStatuses()
    {
        var teachersToFix = await _context.TeacherProfiles
            .Where(t => t.IsApproved && !t.IsDataSubmitted)
            .ToListAsync();

        if (teachersToFix.Any())
        {
            foreach (var t in teachersToFix)
            {
                t.IsDataSubmitted = true;
            }
            await _context.SaveChangesAsync();
        }

        return Ok(new { count = teachersToFix.Count });
    }

    // 9. Clear Manual Cache
    [HttpPost("clear-cache")]
    public async Task<ActionResult> ClearManualCache()
    {
        _cache.Remove("ApprovedTeachersList");
        _cache.Remove("SitemapXml");
        return Ok(new { message = "تم تفريغ الذاكرة المؤقتة بنجاح." });
    }
}
