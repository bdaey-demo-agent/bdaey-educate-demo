using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public interface IFileService
    {
        Task<string> UploadFileAsync(IFormFile file, string[] allowedExtensions, long maxSizeInBytes, string subFolder = "uploads");
    }
}
