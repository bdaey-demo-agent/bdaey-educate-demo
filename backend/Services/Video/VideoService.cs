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
        var provider = _providers.FirstOrDefault(p =>
            p.ProviderName.Equals(providerName, StringComparison.OrdinalIgnoreCase));

        if (provider == null)
            throw new InvalidOperationException($"Video provider '{providerName}' is not configured.");

        return provider;
    }

    public async Task<VideoRoomInfo> PrepareSessionAsync(int sessionId, string actorUserId, bool isAdmin = false)
    {
        var session = await _context.Sessions
            .Include(s => s.TeacherProfile)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new KeyNotFoundException("Session not found.");

        var isAssignedTeacher = session.TeacherProfile?.UserId == actorUserId;
        if (!isAdmin && !isAssignedTeacher)
        {
            _logger.LogWarning(
                "Unauthorized room preparation attempt. User {UserId}, Session {SessionId}",
                actorUserId,
                sessionId);
            throw new UnauthorizedAccessException("You are not allowed to prepare this session room.");
        }

        return await PrepareSessionCoreAsync(session);
    }

    private async Task<VideoRoomInfo> PrepareSessionCoreAsync(Data.Entities.Session session)
    {
        if (!string.IsNullOrEmpty(session.RoomUrl) && !string.IsNullOrEmpty(session.DailyRoomName))
        {
            return new VideoRoomInfo
            {
                RoomName = session.DailyRoomName,
                RoomUrl = session.RoomUrl
            };
        }

        var provider = GetActiveProvider();
        var title = $"Session #{session.Id} - {session.TeacherProfile?.User?.FullName}";
        var roomInfo = await provider.PrepareRoomAsync(
            session.Id,
            title,
            session.DurationMinutes,
            session.ScheduledAt);

        session.VideoProvider = provider.ProviderName;
        session.DailyRoomName = roomInfo.RoomName;
        session.RoomUrl = roomInfo.RoomUrl;
        session.VideoStatus = "ready";

        await _context.SaveChangesAsync();
        return roomInfo;
    }

    public async Task<VideoJoinInfo> GetJoinInfoAsync(
        int sessionId,
        string userId,
        string? excludeConnectionId = null,
        bool isAdmin = false)
    {
        var session = await _context.Sessions
            .Include(s => s.Student)
            .Include(s => s.TeacherProfile)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null)
            throw new KeyNotFoundException("Session not found.");

        if (string.IsNullOrEmpty(session.RoomUrl))
            throw new InvalidOperationException("Session room is not prepared.");

        var isTeacher = session.TeacherProfile?.UserId == userId;
        var isStudent = session.StudentId == userId;
        if (!isAdmin && !isTeacher && !isStudent)
        {
            _logger.LogWarning(
                "Unauthorized room join attempt. User {UserId}, Session {SessionId}",
                userId,
                sessionId);
            throw new UnauthorizedAccessException("You are not a participant in this session.");
        }

        if (!isAdmin && session.Status == Data.Entities.SessionStatus.Cancelled)
            throw new InvalidOperationException("This session has been cancelled.");

        var earlyJoinMinutes = int.TryParse(_configuration["Video:EarlyJoinMinutes"], out var configuredEarly)
            ? Math.Clamp(configuredEarly, 0, 60)
            : 15;
        var lateJoinMinutes = int.TryParse(_configuration["Video:LateJoinMinutes"], out var configuredLate)
            ? Math.Clamp(configuredLate, 0, 180)
            : 30;

        var now = DateTime.UtcNow;
        var opensAt = session.ScheduledAt.AddMinutes(-earlyJoinMinutes);
        var closesAt = session.ScheduledAt.AddMinutes(session.DurationMinutes + lateJoinMinutes);
        if (!isAdmin && (now < opensAt || now > closesAt))
            throw new InvalidOperationException("The session room is not available at this time.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException("User not found.");

        var displayName = user.FullName ?? user.UserName ?? "User";

        if (!string.IsNullOrEmpty(excludeConnectionId))
        {
            await _hubContext.Clients
                .GroupExcept(userId, new[] { excludeConnectionId })
                .SendAsync("ForceDisconnect", sessionId);
        }
        else
        {
            await _hubContext.Clients.Group(userId).SendAsync("ForceDisconnect", sessionId);
        }

        var provider = GetActiveProvider();
        try
        {
            var joinInfo = await provider.GetJoinInfoAsync(
                sessionId,
                session.DailyRoomName ?? string.Empty,
                userId,
                displayName,
                isTeacher || isAdmin);
            PopulateJoinInfo(joinInfo, session);
            return joinInfo;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Token generation failed for session {SessionId}. Attempting to recreate the room.",
                sessionId);

            session.RoomUrl = null;
            session.DailyRoomName = null;
            await _context.SaveChangesAsync();

            var roomInfo = await PrepareSessionCoreAsync(session);
            var joinInfo = await provider.GetJoinInfoAsync(
                sessionId,
                roomInfo.RoomName,
                userId,
                displayName,
                isTeacher || isAdmin);
            PopulateJoinInfo(joinInfo, session);
            joinInfo.RoomUrl = roomInfo.RoomUrl;
            return joinInfo;
        }
    }

    private static void PopulateJoinInfo(VideoJoinInfo joinInfo, Data.Entities.Session session)
    {
        joinInfo.RoomUrl = session.RoomUrl ?? string.Empty;
        joinInfo.ScheduledAt = session.ScheduledAt;
        joinInfo.DurationMinutes = session.DurationMinutes;
        joinInfo.StudentId = session.StudentId;
    }
}
