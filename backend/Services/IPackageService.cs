using BdaeyEducat.API.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public interface IPackageService
    {
        Task<IEnumerable<PackageDto>> GetTeacherPackagesAsync(int teacherId, string? currentUserId, bool includeArchived = false);
        Task<IEnumerable<DateTimeOffset>> GetAvailableSlotsAsync(int packageId, DateTimeOffset? start, DateTimeOffset? end, string? excludeUserId);
        Task<IEnumerable<DateTimeOffset>> GetMyPackageSlotsAsync(int packageId, string userId);
        Task<PackageDto> CreatePackageAsync(string requestedByUserId, CreatePackageDto dto, bool isAdmin = false);
        Task<PackageDto> UpdatePackageAsync(int packageId, string requestedByUserId, CreatePackageDto dto, bool isAdmin = false);
        Task DeletePackageAsync(int packageId, string requestedByUserId, bool isAdmin = false, bool applyPenalty = true);
        Task<PackageDto> RestorePackageAsync(int packageId, string requestedByUserId, DateTimeOffset? newStartDate = null, bool isAdmin = false);
        Task<BdaeyEducat.API.Data.Entities.TeacherProfile?> GetTeacherProfileByUserId(string userId);
        
        // Admin Methods
        Task<PagedResult<AdminPackageDto>> GetAdminPackagesAsync(AdminPackageFilterDto filter);
        Task<AdminPackageDetailDto> GetAdminPackageDetailAsync(int id);
        Task UpdatePackageStatusAsync(int id, string adminUserId, UpdatePackageStatusDto dto);
        Task HardDeletePackageAsync(int id);
    }
}
