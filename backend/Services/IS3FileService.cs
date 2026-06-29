namespace BdaeyEducat.API.Services;

public interface IS3FileService
{
    string GeneratePreSignedUploadUrl(string objectKey, string contentType, double durationInMinutes = 15);
    string GeneratePreSignedDownloadUrl(string objectKey, double durationInMinutes = 60);
    Task<string> UploadFileAsync(IFormFile file, string folderName);
    Task<bool> DeleteFileAsync(string objectKey);
}
