using Microsoft.AspNetCore.Mvc;

namespace BdaeyEducat.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class QuranController : ControllerBase
    {
        private static readonly HttpClient _httpClient = new HttpClient();

        // [HttpGet("page/{pageNumber}")]
        public async Task<IActionResult> GetPage(int pageNumber)
        {
            return StatusCode(503, "Quran module is temporarily disabled.");
            /*
            try
            {
                var response = await _httpClient.GetAsync($"https://api.alquran.cloud/v1/page/{pageNumber}/quran-uthmani");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return Content(content, "application/json");
                }
                return StatusCode((int)response.StatusCode, "Failed to fetch Quran page from external API.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error fetching Quran page: {ex.Message}");
            }
            */
        }

        // [HttpGet("surahs")]
        public async Task<IActionResult> GetSurahs()
        {
            return StatusCode(503, "Quran module is temporarily disabled.");
            /*
            try
            {
                var response = await _httpClient.GetAsync("https://api.alquran.cloud/v1/surah");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return Content(content, "application/json");
                }
                return StatusCode((int)response.StatusCode, "Failed to fetch Surahs from external API.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error fetching Surahs: {ex.Message}");
            }
            */
        }
    }
}
