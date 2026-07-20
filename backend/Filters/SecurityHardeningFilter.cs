using System.Security.Claims;
using BdaeyEducat.API.Controllers;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace BdaeyEducat.API.Filters;

/// <summary>
/// Centralized defense-in-depth checks for security-sensitive endpoints.
/// Business rules should still live in the owning services/controllers, but this
/// filter prevents known authorization and untrusted-redirect bypasses.
/// </summary>
public sealed class SecurityHardeningFilter : IAsyncActionFilter
{
    private static readonly HashSet<string> PublicRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Student",
        "Teacher"
    };

    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SecurityHardeningFilter> _logger;

    public SecurityHardeningFilter(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<SecurityHardeningFilter> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var controllerName = context.Controller.GetType().Name;
        var actionName = context.ActionDescriptor.RouteValues.TryGetValue("action", out var action)
            ? action ?? string.Empty
            : string.Empty;

        NormalizeSensitiveAuthOrigin(context, controllerName);

        if (!ValidatePublicRegistrationRoles(context))
            return;

        if (!await AuthorizeVideoAccessAsync(context, controllerName, actionName))
            return;

        if (!await ValidateBookingCreationAsync(context, controllerName, actionName))
            return;

        if (!await ValidateBookingTransitionAsync(context, controllerName, actionName))
            return;

        if (!ValidateDepositReturnUrl(context, controllerName, actionName))
            return;

        await next();
    }

    private bool ValidatePublicRegistrationRoles(ActionExecutingContext context)
    {
        var registerDto = context.ActionArguments.Values.OfType<RegisterDto>().FirstOrDefault();
        if (registerDto is not null)
        {
            var role = string.IsNullOrWhiteSpace(registerDto.Role) ? "Student" : registerDto.Role.Trim();
            if (!PublicRoles.Contains(role))
            {
                context.Result = new BadRequestObjectResult(new { message = "Public registration only supports Student or Teacher roles." });
                return false;
            }

            registerDto.Role = CanonicalRole(role);
        }

        var googleDto = context.ActionArguments.Values.OfType<GoogleAuthDto>().FirstOrDefault();
        if (googleDto is not null)
        {
            var role = string.IsNullOrWhiteSpace(googleDto.Role) ? "Student" : googleDto.Role.Trim();
            if (!PublicRoles.Contains(role))
            {
                context.Result = new BadRequestObjectResult(new { message = "Public Google registration only supports Student or Teacher roles." });
                return false;
            }

            googleDto.Role = CanonicalRole(role);
        }

        return true;
    }

    private async Task<bool> AuthorizeVideoAccessAsync(
        ActionExecutingContext context,
        string controllerName,
        string actionName)
    {
        if (!string.Equals(controllerName, nameof(VideoController), StringComparison.Ordinal))
            return true;

        if (!context.ActionArguments.TryGetValue("sessionId", out var sessionIdValue) || sessionIdValue is not int sessionId)
            return true;

        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            context.Result = new UnauthorizedResult();
            return false;
        }

        var session = await _context.Sessions
            .AsNoTracking()
            .Include(s => s.TeacherProfile)
            .FirstOrDefaultAsync(s => s.Id == sessionId, context.HttpContext.RequestAborted);

        if (session is null)
        {
            context.Result = new NotFoundObjectResult(new { message = "Session not found." });
            return false;
        }

        var isAdmin = context.HttpContext.User.IsInRole("Admin");
        var isTeacher = session.TeacherProfile?.UserId == userId;
        var isStudent = session.StudentId == userId;
        var isPrepare = string.Equals(actionName, nameof(VideoController.PrepareRoom), StringComparison.Ordinal);

        var allowed = isAdmin || isTeacher || (!isPrepare && isStudent);
        if (!allowed)
        {
            _logger.LogWarning(
                "Blocked unauthorized video access. User {UserId}, Session {SessionId}, Action {Action}",
                userId,
                sessionId,
                actionName);
            context.Result = new ForbidResult();
            return false;
        }

        return true;
    }

    private async Task<bool> ValidateBookingCreationAsync(
        ActionExecutingContext context,
        string controllerName,
        string actionName)
    {
        if (!string.Equals(controllerName, nameof(BookingsController), StringComparison.Ordinal) ||
            !string.Equals(actionName, nameof(BookingsController.CreateBooking), StringComparison.Ordinal))
            return true;

        var dto = context.ActionArguments.Values.OfType<CreateBookingDto>().FirstOrDefault();
        if (dto is null)
            return true;

        var package = await _context.Packages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == dto.PackageId, context.HttpContext.RequestAborted);

        if (package is null)
        {
            context.Result = new NotFoundObjectResult(new { message = "Package not found." });
            return false;
        }

        if (package.TeacherProfileId != dto.TeacherProfileId)
        {
            _logger.LogWarning(
                "Blocked package/teacher mismatch. Package {PackageId}, Requested teacher {TeacherProfileId}, Actual teacher {ActualTeacherProfileId}",
                dto.PackageId,
                dto.TeacherProfileId,
                package.TeacherProfileId);
            context.Result = new BadRequestObjectResult(new { message = "The selected package does not belong to the selected teacher." });
            return false;
        }

        if (dto.ProposedTimes is null || dto.ProposedTimes.Count == 0 || dto.ProposedTimes.Count > package.SessionsCount)
        {
            context.Result = new BadRequestObjectResult(new { message = "The proposed session count is invalid for this package." });
            return false;
        }

        if (dto.ProposedTimes.Select(t => t.UtcDateTime).Distinct().Count() != dto.ProposedTimes.Count)
        {
            context.Result = new BadRequestObjectResult(new { message = "Duplicate session times are not allowed." });
            return false;
        }

        var now = DateTimeOffset.UtcNow;
        if (dto.ProposedTimes.Any(t => t <= now || t < package.StartDate || t > package.EndDate))
        {
            context.Result = new BadRequestObjectResult(new { message = "One or more proposed session times are outside the package period or are in the past." });
            return false;
        }

        // For packages that have not started, the complete package schedule must be selected.
        // Late joins may legitimately contain fewer remaining sessions.
        if (package.StartDate >= now && dto.ProposedTimes.Count != package.SessionsCount)
        {
            context.Result = new BadRequestObjectResult(new { message = $"This package requires exactly {package.SessionsCount} sessions." });
            return false;
        }

        return true;
    }

    private async Task<bool> ValidateBookingTransitionAsync(
        ActionExecutingContext context,
        string controllerName,
        string actionName)
    {
        if (!string.Equals(controllerName, nameof(BookingsController), StringComparison.Ordinal) ||
            !string.Equals(actionName, nameof(BookingsController.UpdateBookingStatus), StringComparison.Ordinal))
            return true;

        if (!context.ActionArguments.TryGetValue("id", out var idValue) || idValue is not int bookingId)
            return true;

        var dto = context.ActionArguments.Values.OfType<BookingStatusDto>().FirstOrDefault();
        if (dto is null || !Enum.TryParse<BookingStatus>(dto.Status, true, out var requestedStatus))
        {
            context.Result = new BadRequestObjectResult(new { message = "Invalid booking status." });
            return false;
        }

        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            context.Result = new UnauthorizedResult();
            return false;
        }

        var booking = await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TeacherProfile)
            .FirstOrDefaultAsync(b => b.Id == bookingId, context.HttpContext.RequestAborted);

        if (booking is null)
        {
            context.Result = new NotFoundResult();
            return false;
        }

        var isTeacher = booking.TeacherProfile?.UserId == userId;
        var isStudent = booking.StudentId == userId;
        if (!isTeacher && !isStudent)
        {
            context.Result = new ForbidResult();
            return false;
        }

        var allowed = isTeacher
            ? IsTeacherTransitionAllowed(booking.Status, requestedStatus)
            : IsStudentTransitionAllowed(booking.Status, requestedStatus);

        if (!allowed)
        {
            _logger.LogWarning(
                "Blocked invalid booking transition. User {UserId}, Booking {BookingId}, From {From}, To {To}",
                userId,
                bookingId,
                booking.Status,
                requestedStatus);
            context.Result = new BadRequestObjectResult(new { message = "This booking status transition is not allowed for your role." });
            return false;
        }

        return true;
    }

    private bool ValidateDepositReturnUrl(
        ActionExecutingContext context,
        string controllerName,
        string actionName)
    {
        if (!string.Equals(controllerName, nameof(WalletController), StringComparison.Ordinal) ||
            !string.Equals(actionName, nameof(WalletController.Deposit), StringComparison.Ordinal))
            return true;

        var dto = context.ActionArguments.Values.OfType<DepositDto>().FirstOrDefault();
        if (dto is null)
            return true;

        if (dto.Amount < 10 || dto.Amount > 1_000_000)
        {
            context.Result = new BadRequestObjectResult(new { message = "Deposit amount is outside the allowed range." });
            return false;
        }

        if (!string.IsNullOrWhiteSpace(dto.ReturnUrl) && !IsAllowedAbsoluteUrl(dto.ReturnUrl))
        {
            context.Result = new BadRequestObjectResult(new { message = "ReturnUrl is not allowed." });
            return false;
        }

        var referer = context.HttpContext.Request.Headers["Referer"].ToString();
        if (!string.IsNullOrWhiteSpace(referer) && !IsAllowedAbsoluteUrl(referer))
            context.HttpContext.Request.Headers.Remove("Referer");

        return true;
    }

    private void NormalizeSensitiveAuthOrigin(ActionExecutingContext context, string controllerName)
    {
        if (!string.Equals(controllerName, nameof(AuthController), StringComparison.Ordinal))
            return;

        var frontendUrl = _configuration["FrontendUrl"];
        if (TryGetOrigin(frontendUrl, out var trustedOrigin))
            context.HttpContext.Request.Headers["Origin"] = trustedOrigin;
        else
            context.HttpContext.Request.Headers.Remove("Origin");
    }

    private bool IsAllowedAbsoluteUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme is not ("https" or "http"))
            return false;

        var candidateOrigin = BuildOrigin(uri);
        var configuredOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

        if (configuredOrigins.Any(origin =>
                TryGetOrigin(origin, out var configuredOrigin) &&
                string.Equals(configuredOrigin, candidateOrigin, StringComparison.OrdinalIgnoreCase)))
            return true;

        return TryGetOrigin(_configuration["FrontendUrl"], out var frontendOrigin) &&
               string.Equals(frontendOrigin, candidateOrigin, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsTeacherTransitionAllowed(BookingStatus current, BookingStatus requested) =>
        (current == BookingStatus.Pending && requested is BookingStatus.Confirmed or BookingStatus.Cancelled) ||
        (current == BookingStatus.Confirmed && requested == BookingStatus.Cancelled);

    private static bool IsStudentTransitionAllowed(BookingStatus current, BookingStatus requested) =>
        (current is BookingStatus.Pending or BookingStatus.Confirmed) && requested == BookingStatus.Cancelled;

    private static string CanonicalRole(string role) =>
        role.Equals("Teacher", StringComparison.OrdinalIgnoreCase) ? "Teacher" : "Student";

    private static bool TryGetOrigin(string? value, out string origin)
    {
        origin = string.Empty;
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme is not ("https" or "http"))
            return false;

        origin = BuildOrigin(uri);
        return true;
    }

    private static string BuildOrigin(Uri uri)
    {
        var defaultPort = (uri.Scheme == Uri.UriSchemeHttps && uri.Port == 443) ||
                          (uri.Scheme == Uri.UriSchemeHttp && uri.Port == 80);
        return $"{uri.Scheme}://{uri.Host}{(defaultPort ? string.Empty : $":{uri.Port}")}";
    }
}
