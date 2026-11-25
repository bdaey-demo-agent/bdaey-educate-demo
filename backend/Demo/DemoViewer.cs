// DEMO-ONLY. This file set lives on the demo-viewer branch and must never be merged into main
// or into academy deployments. Everything here is inert unless DemoViewer:Enabled=true.
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace BdaeyEducat.API.Demo;

public static class DemoViewerDefaults
{
    public const string ReadOnlyClaim = "demo_readonly";
    public const string InviteClaim = "demo_invite";
    public const int SessionMinutes = 120;

    public static bool IsEnabled(IConfiguration c) => c.GetValue<bool>("DemoViewer:Enabled");

    public static string Hash(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    // role key -> demo account email (overridable by config DemoViewer:Accounts:<role>)
    public static string? EmailFor(IConfiguration c, string role) => role switch
    {
        "admin" => c["DemoViewer:Accounts:admin"] ?? "admin@bdaey.com",
        "teacher" => c["DemoViewer:Accounts:teacher"] ?? "teacher@bdaey.com",
        "student" => c["DemoViewer:Accounts:student"] ?? "student@bdaey.com",
        "inactive-teacher" => c["DemoViewer:Accounts:inactive-teacher"] ?? "guardteacher@bdaey.com",
        _ => null
    };

    public static async Task EnsureTableAsync(ApplicationDbContext db)
    {
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"CREATE TABLE IF NOT EXISTS quran.""DemoInvites"" (
            ""Id"" uuid PRIMARY KEY,
            ""TokenHash"" text NOT NULL UNIQUE,
            ""Label"" text NULL,
            ""ExpiresAt"" timestamptz NOT NULL,
            ""RedeemedAt"" timestamptz NULL,
            ""RevokedAt"" timestamptz NULL)");
        }
        catch (Exception)
        {
            // The app role may lack CREATE on the schema; the table is then provisioned out of band.
        }
    }
}

public class InviteRow
{
    public Guid Id { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}

public class RedeemDto { public string? Token { get; set; } }
public class SwitchDto { public string? Role { get; set; } }

[ApiController]
[Route("api/demo")]
public class DemoViewerController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _users;
    private readonly IJwtTokenService _jwt;

    public DemoViewerController(IConfiguration config, ApplicationDbContext db, UserManager<ApplicationUser> users, IJwtTokenService jwt)
    {
        _config = config; _db = db; _users = users; _jwt = jwt;
    }

    private object Disabled() => new { error = "NotFound" };

    // One-time redemption of an invitation token. Never reusable: the first call atomically marks it redeemed.
    [HttpPost("redeem")]
    [AllowAnonymous]
    public async Task<IActionResult> Redeem([FromBody] RedeemDto dto)
    {
        if (!DemoViewerDefaults.IsEnabled(_config)) return NotFound();
        if (string.IsNullOrWhiteSpace(dto?.Token) || dto.Token.Length < 32 || dto.Token.Length > 200)
            return Unauthorized(new { code = "InvalidInvite", message = "Invalid or expired invitation." });

        await DemoViewerDefaults.EnsureTableAsync(_db);
        var hash = DemoViewerDefaults.Hash(dto.Token);

        var rows = await _db.Database.ExecuteSqlInterpolatedAsync($@"UPDATE quran.""DemoInvites""
            SET ""RedeemedAt"" = now()
            WHERE ""TokenHash"" = {hash} AND ""RedeemedAt"" IS NULL AND ""RevokedAt"" IS NULL AND ""ExpiresAt"" > now()");
        if (rows != 1)
            return Unauthorized(new { code = "InvalidInvite", message = "Invalid or expired invitation." });

        var invite = await _db.Database.SqlQuery<InviteRow>($@"SELECT ""Id"", ""ExpiresAt"", ""RedeemedAt"", ""RevokedAt"" FROM quran.""DemoInvites"" WHERE ""TokenHash"" = {hash}").FirstAsync();
        return await IssueAsync(invite, "admin");
    }

    [HttpPost("switch")]
    [Authorize]
    public async Task<IActionResult> Switch([FromBody] SwitchDto dto)
    {
        if (!DemoViewerDefaults.IsEnabled(_config)) return NotFound();
        if (User.FindFirst(DemoViewerDefaults.ReadOnlyClaim)?.Value != "true")
            return Forbid();
        if (!Guid.TryParse(User.FindFirst(DemoViewerDefaults.InviteClaim)?.Value, out var inviteId))
            return Forbid();

        var invite = await GetInviteAsync(_db, inviteId);
        if (!DemoViewerMiddlewareHelpers.IsLive(invite)) return Unauthorized(new { code = "DemoSessionEnded", message = "Demo session ended." });
        return await IssueAsync(invite!, dto?.Role ?? "");
    }

    public static async Task<InviteRow?> GetInviteAsync(ApplicationDbContext db, Guid id)
        => await db.Database.SqlQuery<InviteRow>($@"SELECT ""Id"", ""ExpiresAt"", ""RedeemedAt"", ""RevokedAt"" FROM quran.""DemoInvites"" WHERE ""Id"" = {id}").FirstOrDefaultAsync();

    private async Task<IActionResult> IssueAsync(InviteRow invite, string role)
    {
        var email = DemoViewerDefaults.EmailFor(_config, role);
        if (email == null) return BadRequest(new { code = "UnknownRole" });
        var user = await _users.FindByEmailAsync(email);
        if (user == null) return NotFound(new { code = "DemoAccountMissing" });

        var roles = (await _users.GetRolesAsync(user)).ToList();
        var end = DemoViewerMiddlewareHelpers.SessionEnd(invite);
        var claims = new[]
        {
            new Claim(DemoViewerDefaults.ReadOnlyClaim, "true"),
            new Claim(DemoViewerDefaults.InviteClaim, invite.Id.ToString())
        };
        var token = _jwt.GenerateJwtToken(user, roles, claims, end);
        return Ok(new
        {
            id = user.Id,
            token,
            refreshToken = "",
            email = user.Email,
            fullName = user.FullName,
            role = roles.FirstOrDefault(),
            userName = user.UserName,
            expiration = end,
            isBlocked = user.IsBlocked,
            emailConfirmed = user.EmailConfirmed,
            gender = user.Gender,
            isNewUser = false,
            readOnly = true,
            demoRole = role
        });
    }
}

public static class DemoViewerMiddlewareHelpers
{
    public static DateTime SessionEnd(InviteRow i)
    {
        var end = (i.RedeemedAt ?? DateTime.UtcNow).AddMinutes(DemoViewerDefaults.SessionMinutes);
        return end;
    }

    public static bool IsLive(InviteRow? i)
        => i != null && i.RevokedAt == null && i.RedeemedAt != null && DateTime.UtcNow < SessionEnd(i);
}

// Server-side enforcement: a read-only demo token can only make safe requests.
public class ReadOnlyDemoMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;

    public ReadOnlyDemoMiddleware(RequestDelegate next, IMemoryCache cache)
    {
        _next = next; _cache = cache;
    }

    private static bool IsSafeMethod(string m)
        => HttpMethods.IsGet(m) || HttpMethods.IsHead(m) || HttpMethods.IsOptions(m);

    public async Task InvokeAsync(HttpContext ctx, IServiceScopeFactory scopes)
    {
        if (ctx.User.Identity?.IsAuthenticated != true ||
            ctx.User.FindFirst(DemoViewerDefaults.ReadOnlyClaim)?.Value != "true")
        {
            await _next(ctx);
            return;
        }

        var path = ctx.Request.Path;

        // Only the explicit switch call may use a non-safe method.
        var isSwitch = HttpMethods.IsPost(ctx.Request.Method) && path.Equals("/api/demo/switch", StringComparison.OrdinalIgnoreCase);
        var blocked = !IsSafeMethod(ctx.Request.Method) && !isSwitch;

        // Safe-method requests that still have side effects: SignalR (marks teachers online, sends chat)
        // and creating a video room on join.
        if (path.StartsWithSegments("/hub") ||
            path.Value?.Contains("/api/video", StringComparison.OrdinalIgnoreCase) == true)
            blocked = true;

        if (blocked)
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            await ctx.Response.WriteAsJsonAsync(new { code = "DemoReadOnly", message = "This demo session is view-only." });
            return;
        }

        // Revocation / expiry: re-check the invite (short cache so revocation takes effect within seconds).
        if (!Guid.TryParse(ctx.User.FindFirst(DemoViewerDefaults.InviteClaim)?.Value, out var inviteId))
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }
        var key = "demo_invite_live_" + inviteId;
        if (!_cache.TryGetValue(key, out bool live))
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            live = DemoViewerMiddlewareHelpers.IsLive(await DemoViewerController.GetInviteAsync(db, inviteId));
            _cache.Set(key, live, TimeSpan.FromSeconds(5));
        }
        if (!live)
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await ctx.Response.WriteAsJsonAsync(new { code = "DemoSessionEnded", message = "Demo session ended." });
            return;
        }

        await _next(ctx);
    }
}
