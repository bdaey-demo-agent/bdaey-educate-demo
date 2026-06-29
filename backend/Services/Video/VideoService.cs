using BdaeyEducat.API.Data;
using Microsoft.EntityFrameworkCore;

using BdaeyEducat.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BdaeyEducat.API.Services.Video;

public class VideoService
{
    private readonly IEnumerable<IVideoProvider> _providers;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<VideoService> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;

    public VideoService(
        IEnumerable<IVideoProvider> providers, 
        IConfiguration configuration, 
        ApplicationDbContext context, 
        ILogger<VideoService> logger,
        IHubContext<NotificationHub> hubContext)
    {
        _providers = providers;
        _configuration = configuration;
        _context = context;
        _logger = logger;
        _hubContext = hubContext;
    }

    private IVideoProvider GetActiveProvider()
    {
        var providerName = _configuration["Video:Provider"] ?? "daily";
        var provider = _providers.FirstOrDefault(p => p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));
        
        if (provider == null)
            throw new Exception($"Video provider '{providerName}' not found.");
            
        return provider;
    }

    public async Task<VideoRoomInfo> PrepareSessionAsync(int sessionId)
    {
        var session = await _context.Sessions
            .Include(s => s.TeacherProfile)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) throw new Exception("Session not found.");

        // If already prepared, return existing
        if (!string.IsNullOrEmpty(session.RoomUrl) && !string.IsNullOrEmpty(session.DailyRoomName))
        {
            return new VideoRoomInfo
            {
                RoomName = session.DailyRoomName,
                RoomUrl = session.RoomUrl
            };
        }

        var provider = GetActiveProvider();
        var title = $"Session #{sessionId} - {session.TeacherProfile?.User?.FullName}";
        
        var roomInfo = await provider.PrepareRoomAsync(sessionId, title, session.DurationMinutes, session.ScheduledAt);

        session.VideoProvider = provider.ProviderName;
        session.DailyRoomName = roomInfo.RoomName;
        session.RoomUrl = roomInfo.RoomUrl;
        session.VideoStatus = "ready";

        await _context.SaveChangesAsync();

        return roomInfo;
    }

    public async Task<VideoJoinInfo> GetJoinInfoAsync(int sessionId, string userId, string? excludeConnectionId = null)
    {
        var session = await _context.Sessions
            .Include(s => s.Student)
            .Include(s => s.TeacherProfile)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) throw new Exception("Session not found.");
        if (string.IsNullOrEmpty(session.RoomUrl)) throw new Exception("Session room not prepared.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("User not found.");

        var isTeacher = session.TeacherProfile?.UserId == userId;
        var displayName = user.FullName ?? user.UserName ?? "Guest";

        // Force disconnect other devices for this user
        // Force disconnect other devices for this user
        if (!string.IsNullOrEmpty(excludeConnectionId))
        {
            await _hubContext.Clients.GroupExcept(userId, new[] { excludeConnectionId }).SendAsync("ForceDisconnect", sessionId);
        }
        else
        {
            await _hubContext.Clients.Group(userId).SendAsync("ForceDisconnect", sessionId);
        }

        var provider = GetActiveProvider();
        try 
        {
            var joinInfo = await provider.GetJoinInfoAsync(sessionId, session.DailyRoomName ?? "", userId, displayName, isTeacher);
            joinInfo.RoomUrl = session.RoomUrl;
            joinInfo.ScheduledAt = session.ScheduledAt;
            joinInfo.DurationMinutes = session.DurationMinutes;
            joinInfo.StudentId = session.StudentId;
            return joinInfo;
        }
        catch (Exception)
        {
            // Token generation failed, likely because room expired or invalid.
            // Try to re-prepare the room properly.
            _logger.LogWarning($"Token generation failed for session {sessionId}. Attempting to re-create room.");
            
            // Clear old room info
            session.RoomUrl = null;
            session.DailyRoomName = null;
            await _context.SaveChangesAsync();

            // Re-prepare
            var roomInfo = await PrepareSessionAsync(sessionId);
            
            // Retry token generation
            var joinInfo = await provider.GetJoinInfoAsync(sessionId, roomInfo.RoomName, userId, displayName, isTeacher);
            joinInfo.RoomUrl = roomInfo.RoomUrl;
            joinInfo.ScheduledAt = session.ScheduledAt;
            joinInfo.DurationMinutes = session.DurationMinutes;
            joinInfo.StudentId = session.StudentId;
            return joinInfo;
        }
    }
}
