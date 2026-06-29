namespace BdaeyEducat.API.Dtos;

public class BadgeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
}

public class StudentGamificationProfileDto
{
    public int TotalPoints { get; set; }
    public List<BadgeDto> EarnedBadges { get; set; } = new();
    public int NextBadgePoints { get; set; }
    public string? NextBadgeName { get; set; }
}

public class LeaderboardEntryDto
{
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public int TotalPoints { get; set; }
    public int Rank { get; set; }
}
