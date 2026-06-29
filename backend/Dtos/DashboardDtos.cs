namespace BdaeyEducat.API.Dtos;

public class StudentDashboardDto
{
    public decimal WalletBalance { get; set; }
    public string Currency { get; set; } = "EGP";
    public int ActiveBookingsCount { get; set; }
    public int UnreadNotificationsCount { get; set; }
    public SessionDto? NextSession { get; set; }
}

public class TeacherDashboardDto
{
    public decimal WalletBalance { get; set; }
    public string Currency { get; set; } = "EGP";
    public decimal TodayIncome { get; set; }
    public int ActiveStudentsCount { get; set; }
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public SessionDto? NextSession { get; set; }
}
