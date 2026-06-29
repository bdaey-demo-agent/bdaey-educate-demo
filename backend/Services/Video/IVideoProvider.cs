namespace BdaeyEducat.API.Services.Video;

public interface IVideoProvider
{
    string ProviderName { get; }
    Task<VideoRoomInfo> PrepareRoomAsync(int sessionId, string title, int durationMinutes, DateTimeOffset scheduledAt);
    Task<VideoJoinInfo> GetJoinInfoAsync(int sessionId, string roomName, string userId, string displayName, bool isTeacher);
}

public class VideoRoomInfo
{
    public string RoomName { get; set; } = string.Empty;
    public string RoomUrl { get; set; } = string.Empty;
}

public class VideoJoinInfo
{
    public string RoomUrl { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTimeOffset ScheduledAt { get; set; }
    public int DurationMinutes { get; set; }
    public string? StudentId { get; set; }
}
