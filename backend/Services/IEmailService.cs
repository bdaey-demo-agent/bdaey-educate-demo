using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string message);
    }
}
