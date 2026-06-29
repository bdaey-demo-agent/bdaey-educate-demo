using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using BdaeyEducat.API.Services;

namespace BdaeyEducat.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWalletService _walletService;

    public DashboardController(ApplicationDbContext context, IWalletService walletService)
    {
        _context = context;
        _walletService = walletService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var isTeacher = User.IsInRole("Teacher");
        var wallet = await _walletService.GetOrCreateWalletAsync(userId);
        
        // Next Session (Common)
        // Find the soonest session in the future (or recently started but not completed)
        var nextSessionStart = DateTime.UtcNow.AddMinutes(-30); // Show sessions that started up to 30 mins ago too
        
        var nextSession = await _context.Sessions
            .Include(s => s.TeacherProfile).ThenInclude(t => t!.User)
            .Include(s => s.Student)
            .Where(s => (s.StudentId == userId || s.TeacherProfile!.UserId == userId) 
                        && s.Status != SessionStatus.Completed 
                        && s.Status != SessionStatus.Cancelled
                        && s.ScheduledAt >= nextSessionStart) 
            .OrderBy(s => s.ScheduledAt)
            .FirstOrDefaultAsync();

        SessionDto? nextSessionDto = null;
        if (nextSession != null)
        {
            nextSessionDto = new SessionDto
            {
                Id = nextSession.Id,
                BookingId = nextSession.BookingId,
                StudentId = nextSession.StudentId,
                StudentName = nextSession.Student?.FullName ?? "Unknown",
                TeacherProfileId = nextSession.TeacherProfileId,
                TeacherName = nextSession.TeacherProfile?.User?.FullName ?? "Unknown",
                ScheduledAt = nextSession.ScheduledAt,
                DurationMinutes = nextSession.DurationMinutes,
                Status = nextSession.Status.ToString(),
                RoomUrl = nextSession.RoomUrl
            };
        }

        if (isTeacher)
        {
            var teacherProfile = await _context.TeacherProfiles.FirstOrDefaultAsync(t => t.UserId == userId);
            if (teacherProfile == null) return BadRequest("Teacher profile not found");

            // Stats
            var today = DateTime.UtcNow.Date;
            var todayIncome = await _context.WalletTransactions
                .Where(t => t.WalletId == wallet.Id && t.Type == TransactionType.Income && t.CreatedAt >= today)
                .SumAsync(t => t.Amount);

            var activeStudents = await _context.Bookings
                .Where(b => b.TeacherProfileId == teacherProfile.Id && b.Status == BookingStatus.Confirmed)
                .Select(b => b.StudentId)
                .Distinct()
                .CountAsync();

            return Ok(new TeacherDashboardDto
            {
                WalletBalance = wallet.Balance,
                Currency = wallet.Currency,
                TodayIncome = todayIncome,
                ActiveStudentsCount = activeStudents,
                AverageRating = teacherProfile.AverageRating,
                TotalReviews = teacherProfile.TotalReviews,
                NextSession = nextSessionDto
            });
        }
        else
        {
            // Student
            var activeBookings = await _context.Bookings
                .CountAsync(b => b.StudentId == userId && b.Status == BookingStatus.Confirmed);

            var unreadNotifs = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new StudentDashboardDto
            {
                WalletBalance = wallet.Balance,
                Currency = wallet.Currency,
                ActiveBookingsCount = activeBookings,
                UnreadNotificationsCount = unreadNotifs,
                NextSession = nextSessionDto
            });
        }
    }
}
