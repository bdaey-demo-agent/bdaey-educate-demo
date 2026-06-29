using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace BdaeyEducat.API.Services.Video;

public class DailyVideoProvider : IVideoProvider
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DailyVideoProvider> _logger;

    public string ProviderName => "daily";

    public DailyVideoProvider(IConfiguration configuration, ILogger<DailyVideoProvider> logger, IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient("DailyVideo");
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<VideoRoomInfo> PrepareRoomAsync(int sessionId, string title, int durationMinutes, DateTimeOffset scheduledAt)
    {
        var apiKey = _configuration["DAILY_API_KEY"];
        var domain = _configuration["Daily:Domain"] ?? "bdaey-educate.daily.co";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("DAILY_API_KEY is missing.");
            throw new Exception("Video provider configuration error.");
        }

        var roomName = $"session_{sessionId}_{Guid.NewGuid().ToString("N").Substring(0, 8)}";
        
        var requestData = new
        {
            name = roomName,
            privacy = "private", 
            properties = new
            {
                // Expire 2 hours after the *scheduled end time*, or 2 hours from now if it already started
                exp = (scheduledAt > DateTimeOffset.UtcNow ? scheduledAt : DateTimeOffset.UtcNow)
                          .AddMinutes(durationMinutes + 120).ToUnixTimeSeconds(), 
                enable_chat = true,
                start_audio_off = false,
                start_video_off = false
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.daily.co/v1/rooms");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Daily API returned {StatusCode} for room creation", response.StatusCode);
            throw new Exception("Failed to create video room. Please try again later.");
        }

        using var doc = JsonDocument.Parse(content);
        return new VideoRoomInfo
        {
            RoomName = roomName,
            RoomUrl = doc.RootElement.GetProperty("url").GetString() ?? ""
        };
    }

    public async Task<VideoJoinInfo> GetJoinInfoAsync(int sessionId, string roomName, string userId, string displayName, bool isTeacher)
    {
        var apiKey = _configuration["DAILY_API_KEY"];
        if (string.IsNullOrEmpty(apiKey)) throw new Exception("Video configuration missing.");

        if (string.IsNullOrEmpty(roomName))
        {
            return new VideoJoinInfo { DisplayName = displayName };
        }

        // Generate a Meeting Token
        // This ensures the user is identified by the platform and can enter private rooms.
        var tokenData = new
        {
            properties = new
            {
                room_name = roomName,
                user_name = displayName,
                user_id = userId,
                is_owner = isTeacher,
                enable_recording = "cloud",
                start_video_off = false,
                start_audio_off = false
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.daily.co/v1/meeting-tokens");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(tokenData), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            using var doc = JsonDocument.Parse(content);
            return new VideoJoinInfo
            {
                Token = doc.RootElement.GetProperty("token").GetString() ?? "",
                DisplayName = displayName
            };
        }
        
        _logger.LogError("Daily token API returned {StatusCode}", response.StatusCode);
        throw new Exception("Failed to generate meeting token. Please try again later.");
    }
}
