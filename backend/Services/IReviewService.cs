using BdaeyEducat.API.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public interface IReviewService
    {
        Task<ReviewDto> AddReviewAsync(string studentId, CreateReviewDto dto);
        Task<IEnumerable<ReviewDto>> GetTeacherReviewsAsync(int teacherId);
    }
}
