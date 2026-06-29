using BdaeyEducat.API.Data.Enums;

namespace BdaeyEducat.API.Dtos
{
    public class AdminPackageDto : PackageDto
    {
        public string TeacherName { get; set; } = string.Empty;
        public string TeacherEmail { get; set; } = string.Empty;
        public new string Status { get; set; } = string.Empty; // Override/Hide base for explicit Enum string or stick to string
        public int TotalBookingsCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminPackageDetailDto : AdminPackageDto
    {
        public int PendingBookingsCount { get; set; }
        public int CompletedBookingsCount { get; set; }
        public int CancelledBookingsCount { get; set; }
        public int UpcomingSessionsCount { get; set; }
        public DateTime? LastBookingDate { get; set; }
        public bool CanDelete { get; set; }
        public string? AdminNote { get; set; }
        public List<string> AuditLogs { get; set; } = new(); // Simplified log for now
    }

    public class UpdatePackageStatusDto
    {
        public PackageStatus Status { get; set; }
        public string? Reason { get; set; }
    }

    public class AdminPackageFilterDto
    {
        public string? Search { get; set; }
        public PackageStatus? Status { get; set; }
        public int? TeacherId { get; set; }
        public bool? HasBookings { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }
}
