using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace BdaeyEducat.API.Services;

public class S3FileService : IS3FileService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly ILogger<S3FileService> _logger;

    public S3FileService(IConfiguration config, ILogger<S3FileService> logger)
    {
        var awsConfig = config.GetSection("AWS");
        _logger = logger;

        var accessKey = (awsConfig["AccessKey"] ?? Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID"))?.Trim();
        var secretKey = (awsConfig["SecretKey"] ?? Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY"))?.Trim();
        var regionString = (awsConfig["Region"] ?? Environment.GetEnvironmentVariable("AWS_REGION"))?.Trim();

        _bucketName =
            (awsConfig["BucketName"] ?? Environment.GetEnvironmentVariable("AWS_BUCKET_NAME"))?.Trim()
            ?? "bdaey-storage-2026";

        var region = !string.IsNullOrWhiteSpace(regionString)
            ? RegionEndpoint.GetBySystemName(regionString)
            : RegionEndpoint.EUCentral1;

        var s3Config = new AmazonS3Config
        {
            RegionEndpoint = region,
            UseArnRegion = true,
            ForcePathStyle = false,
        };

        if (!string.IsNullOrWhiteSpace(accessKey) && !string.IsNullOrWhiteSpace(secretKey))
        {
            var credentials = new BasicAWSCredentials(accessKey, secretKey);
            _s3Client = new AmazonS3Client(credentials, s3Config);
        }
        else
        {
            // Fallback: uses env/instance credentials if available
            _s3Client = new AmazonS3Client(s3Config);
        }
    }

    public string GeneratePreSignedUploadUrl(string objectKey, string contentType, double durationInMinutes = 15)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(durationInMinutes),
            ContentType = contentType
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public string GeneratePreSignedDownloadUrl(string objectKey, double durationInMinutes = 60)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(durationInMinutes)
        };

        return _s3Client.GetPreSignedURL(request);
    }

    public async Task<bool> DeleteFileAsync(string objectKey)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey
            };

            await _s3Client.DeleteObjectAsync(request);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete S3 object: {ObjectKey}", objectKey);
            return false;
        }
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty or null");

        var extension = Path.GetExtension(file.FileName ?? "").ToLowerInvariant();
        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var objectKey = string.IsNullOrWhiteSpace(folderName)
            ? uniqueFileName
            : $"{folderName.TrimEnd('/')}/{uniqueFileName}";

        var uploadRequest = new PutObjectRequest
        {
            InputStream = file.OpenReadStream(),
            Key = objectKey,
            BucketName = _bucketName,
            ContentType = file.ContentType
        };

        _logger.LogInformation("Uploading to S3. Key: {Key}, ContentType: '{ContentType}', Bucket: {Bucket}", objectKey, file.ContentType, _bucketName);

        var response = await _s3Client.PutObjectAsync(uploadRequest);

        if (response.HttpStatusCode != System.Net.HttpStatusCode.OK)
            throw new Exception("Failed to upload file to S3");

        return objectKey;
    }
}
