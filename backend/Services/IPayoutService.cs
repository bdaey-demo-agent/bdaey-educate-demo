using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public interface IPayoutService
    {
        Task ProcessSessionPayoutAsync(int sessionId, string finalizedBy);
    }
}
