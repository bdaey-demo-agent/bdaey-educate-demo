using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace BdaeyEducat.API.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _config;
        private readonly string _host;
        private readonly int _port;
        private readonly string _senderEmail;
        private readonly string _password;
        private readonly bool _enableSsl;

        public EmailService(ILogger<EmailService> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;

            _host = _config["SmtpSettings:Host"]!;
            _port = int.Parse(_config["SmtpSettings:Port"] ?? "587");
            _senderEmail = _config["SmtpSettings:Email"]!;
            _password = _config["SmtpSettings:Password"]!;
            _enableSsl = bool.Parse(_config["SmtpSettings:EnableSsl"] ?? "true");

            if (string.IsNullOrEmpty(_host))
                throw new InvalidOperationException("SMTP Host is not configured (SmtpSettings:Host).");

            if (string.IsNullOrEmpty(_senderEmail))
                throw new InvalidOperationException("SMTP sender email is not configured (SmtpSettings:Email).");

            if (string.IsNullOrEmpty(_password))
                throw new InvalidOperationException("SMTP password is not configured (SmtpSettings:Password).");
        }

        public async Task SendEmailAsync(string toEmail, string subject, string message)
        {
            try
            {
                _logger.LogInformation("Sending email to {ToEmail} via {Host}:{Port} from {Sender}",
                    toEmail, _host, _port, _senderEmail);

                using var smtp = new SmtpClient(_host, _port);
                smtp.EnableSsl = _enableSsl;
                smtp.UseDefaultCredentials = false;
                smtp.Credentials = new NetworkCredential(_senderEmail, _password);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, "Bdaey Platform"),
                    Subject = subject,
                    Body = message,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(toEmail);

                await smtp.SendMailAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to {ToEmail}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {ToEmail}", toEmail);
                throw;
            }
        }
    }
}