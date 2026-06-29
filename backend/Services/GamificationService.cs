using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Services;

public interface IGamificationService
{
    Task AwardPointsAsync(string studentId, int points);
    Task<StudentGamificationProfileDto> GetStudentProfileAsync(string studentId);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int topN = 10);
    Task AwadBadgesIfEligibleAsync(string studentId, int newTotalPoints);
}

public class GamificationService : IGamificationService
{
    private readonly ApplicationDbContext _context;

    public GamificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AwardPointsAsync(string studentId, int points)
    {
        if (points <= 0) return;

        var student = await _context.Users.FindAsync(studentId);
        if (student == null) throw new ArgumentException($"Student with ID {studentId} not found");

        student.TotalPoints += points;
        await _context.SaveChangesAsync();

        // Check for new badges
        await AwadBadgesIfEligibleAsync(studentId, student.TotalPoints);
    }

    public async Task AwadBadgesIfEligibleAsync(string studentId, int newTotalPoints)
    {
        // Get badges the student already has
        var earnedBadgeIds = await _context.StudentBadges
            .Where(sb => sb.StudentId == studentId)
            .Select(sb => sb.BadgeId)
            .ToListAsync();

        // Find available badges that match point threshold and are not yet earned
        var newBadgesToAward = await _context.Badges
            .Where(b => b.RequiredPoints <= newTotalPoints && !earnedBadgeIds.Contains(b.Id))
            .ToListAsync();

        if (newBadgesToAward.Any())
        {
            var studentBadges = newBadgesToAward.Select(b => new StudentBadge
            {
                StudentId = studentId,
                BadgeId = b.Id,
                EarnedAt = DateTime.UtcNow
            });

            _context.StudentBadges.AddRange(studentBadges);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<StudentGamificationProfileDto> GetStudentProfileAsync(string studentId)
    {
        var student = await _context.Users.FindAsync(studentId);
        if (student == null) return new StudentGamificationProfileDto();

        var earnedBadges = await _context.StudentBadges
            .Include(sb => sb.Badge)
            .Where(sb => sb.StudentId == studentId && sb.Badge != null)
            .Select(sb => new BadgeDto
            {
                Id = sb.Badge!.Id,
                Name = sb.Badge.Name,
                Description = sb.Badge.Description,
                IconUrl = sb.Badge.IconUrl,
                RequiredPoints = sb.Badge.RequiredPoints
            })
            .ToListAsync();

        var nextBadge = await _context.Badges
            .Where(b => b.RequiredPoints > student.TotalPoints)
            .OrderBy(b => b.RequiredPoints)
            .FirstOrDefaultAsync();

        return new StudentGamificationProfileDto
        {
            TotalPoints = student.TotalPoints,
            EarnedBadges = earnedBadges,
            NextBadgePoints = nextBadge?.RequiredPoints ?? 0,
            NextBadgeName = nextBadge?.Name
        };
    }

    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int topN = 10)
    {
        // Get the top N students by points, sorting by points descending, then by Name ascending to break ties
        var leaderboardUsers = await _context.Users
            // Only students. (You might want to filter by UserRole = Student if you have that linked, but assuming points only apply to students)
            // It's safer to join with UserRoles if needed, but since Teachers don't earn points, we can just sort top users.
            // Alternatively, any user with TotalPoints > 0 is fine.
            .Where(u => u.TotalPoints > 0)
            .OrderByDescending(u => u.TotalPoints)
            .ThenBy(u => u.FullName)
            .Take(topN)
            .ToListAsync();

        var leaderboard = new List<LeaderboardEntryDto>();
        for (int i = 0; i < leaderboardUsers.Count; i++)
        {
            var u = leaderboardUsers[i];
            leaderboard.Add(new LeaderboardEntryDto
            {
                StudentId = u.Id,
                StudentName = u.FullName,
                ProfilePictureUrl = u.ProfilePictureUrl,
                TotalPoints = u.TotalPoints,
                Rank = i + 1
            });
        }

        return leaderboard;
    }
}
