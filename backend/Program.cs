using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Identity;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Filters;
using BdaeyEducat.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<HostOptions>(options => 
{ 
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore; 
});

// 1. Configure EF Core with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
{
    var config = serviceProvider.GetRequiredService<IConfiguration>();
    var cs = config.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(cs))
    {
        var connBuilder = new Npgsql.NpgsqlConnectionStringBuilder(cs);
        connBuilder.SearchPath = "quran";
        options.UseNpgsql(connBuilder.ConnectionString, o => o.CommandTimeout(300));
        options.AddInterceptors(new SchemaConnectionInterceptor("quran"));
        options.ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }
});

// 2. Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;
    
    // Enforce Unique Email
    options.User.RequireUniqueEmail = true;
}).AddEntityFrameworkStores<ApplicationDbContext>()
  .AddDefaultTokenProviders();

// 3. Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var keyString = jwtSettings["Key"];

if (string.IsNullOrEmpty(keyString))
{
    throw new InvalidOperationException(
        $"Jwt:Key is not configured. Set it via user-secrets, environment variables, or appsettings. (Environment: {builder.Environment.EnvironmentName})");
}

var key = Encoding.ASCII.GetBytes(keyString);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];

            // If the request is for our hub...
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/hub")))
            {
                // Read the token out of the query string
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// 4. Add Controllers
builder.Services.AddScoped<SecurityHardeningFilter>();
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<SecurityHardeningFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddDataProtection();
builder.Services.AddHttpClient(); // Required for IHttpClientFactory used by Video Providers

// 5. Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// 6. Add CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy",
        corsBuilder =>
        {
            corsBuilder.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                try
                {
                    var uri = new Uri(origin);
                    var host = uri.Host;

                    // Local and private-network origins are development-only.
                    if (builder.Environment.IsDevelopment())
                    {
                        if (host == "localhost" || host == "127.0.0.1") return true;
                        if (host.StartsWith("192.168.") || host.StartsWith("10.") || host.StartsWith("172.")) return true;
                    }

                    // First-party production domains.
                    if (host == "bdaey.com" || host.EndsWith(".bdaey.com", StringComparison.OrdinalIgnoreCase)) return true;

                    // All other hosts must be explicitly configured. Wildcard Vercel/Netlify access is not trusted.
                    return allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                }
                catch
                {
                    return false;
                }
            })
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        });
});

// 7. Add Services
builder.Services.AddMemoryCache(); // In-Memory Cache for fast local data

var redisConfig = builder.Configuration.GetSection("Redis")["Configuration"];
if (!string.IsNullOrEmpty(redisConfig))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConfig;
        options.InstanceName = "Bdaey_";
    });
    builder.Services.AddSignalR().AddStackExchangeRedis(redisConfig, options => {
        options.Configuration.AbortOnConnectFail = false;
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSignalR();
}
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddHostedService<BdaeyEducat.API.Services.ChatCleanupService>();
builder.Services.AddHostedService<BdaeyEducat.API.Services.SessionCleanupService>();
builder.Services.AddHostedService<BdaeyEducat.API.Services.PendingEarningsReleaseService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IEmailService, BdaeyEducat.API.Services.EmailService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IFileService, BdaeyEducat.API.Services.FileService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IS3FileService, BdaeyEducat.API.Services.S3FileService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IPackageService, BdaeyEducat.API.Services.PackageService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IReviewService, BdaeyEducat.API.Services.ReviewService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IAuditLogService, BdaeyEducat.API.Services.AuditLogService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.INotificationService, BdaeyEducat.API.Services.NotificationService>();
builder.Services.AddScoped<BdaeyEducat.API.Services.IGamificationService, BdaeyEducat.API.Services.GamificationService>();

// Kashier Payment Service
builder.Services.Configure<BdaeyEducat.API.Settings.KashierSettings>(builder.Configuration.GetSection("Kashier"));
builder.Services.AddScoped<IKashierPaymentService, KashierPaymentService>();

// Video Provider Services
builder.Services.AddScoped<BdaeyEducat.API.Services.Video.IVideoProvider, BdaeyEducat.API.Services.Video.DailyVideoProvider>();
builder.Services.AddScoped<BdaeyEducat.API.Services.Video.VideoService>();

// JWT Token Service
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// White-label brand identity for outbound emails (Branding:NameAr / Branding:NameEn).
BdaeyEducat.API.Services.EmailTemplates.BrandNameAr = builder.Configuration["Branding:NameAr"] ?? "بدائي";
BdaeyEducat.API.Services.EmailTemplates.BrandNameEn = builder.Configuration["Branding:NameEn"] ?? "BDAEY";
builder.Services.AddScoped<BdaeyEducat.API.Services.IRefreshTokenService, BdaeyEducat.API.Services.RefreshTokenService>();

// Financial Services
builder.Services.AddScoped<BdaeyEducat.API.Services.IPayoutService, BdaeyEducat.API.Services.PayoutService>();

// 8. Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global Policy: 100 requests per minute
    options.AddFixedWindowLimiter("global", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    // Auth Policy: 10 requests per minute (Brute-force protection)
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    // Upload Policy: 20 requests per 5 minutes
    options.AddFixedWindowLimiter("uploads", opt =>
    {
        opt.PermitLimit = 20;
        opt.Window = TimeSpan.FromMinutes(5);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });

    // Contact Policy: 5 requests per hour (spam protection)
    options.AddFixedWindowLimiter("contact", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromHours(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });

    // Deposit Policy: 10 requests per minute
    options.AddFixedWindowLimiter("deposits", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });
});

var app = builder.Build();

// Seed demo data block removed (Duplicate/Unwanted)

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Swagger can be added here later
}

// HTTPS Redirection is disabled to allow access via local IP (e.g. 192.168.x.x) for testing.
// Re-enable this in production if using a proper domain and SSL certificate.
// app.UseHttpsRedirection();

app.UseRouting();

// Return a stable public error shape while logging the full exception server-side.
app.UseExceptionHandler(appError =>
{
    appError.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var logger = context.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");

        if (exceptionFeature?.Error is not null)
        {
            logger.LogError(
                exceptionFeature.Error,
                "Unhandled request exception. TraceId: {TraceId}",
                context.TraceIdentifier);
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            message = "Internal Server Error",
            traceId = context.TraceIdentifier
        });
    });
});

app.UseCors("ProductionPolicy");

// Enable WebSockets for SignalR
var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromMinutes(2)
};
app.UseWebSockets(webSocketOptions);

// Configure Static Files (wwwroot) is no longer serving React frontend, but we might keep it 
// if the API needs to serve its own static assets (e.g., direct simple uploads).
// For S3 migration soon, even this won't be strictly necessary for media.
// We keep a minimal static files setup just in case.
app.UseStaticFiles();

app.UseRateLimiter(); // Place before Authentication

app.UseMiddleware<BdaeyEducat.API.Middleware.TenantMigrationMiddleware>();
app.UseAuthentication();
app.UseMiddleware<BdaeyEducat.API.Middleware.BlockedUserMiddleware>();
app.UseMiddleware<BdaeyEducat.API.Demo.ReadOnlyDemoMiddleware>(); // DEMO-ONLY (demo-viewer branch)
app.UseAuthorization();

app.MapControllers().RequireRateLimiting("global");
app.MapHub<BdaeyEducat.API.Hubs.NotificationHub>("/hub");

// SPA Fallback removed since frontend is deployed independently on Netlify.

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    
    try
    {
        /*
         * Manual DB Check Removed for Neon/Remote Compatibility
         * The manual connection to 'postgres' database often fails with connection poolers.
         * Relying on context.Database.Migrate() below which is sufficient.
         */ 
         // Manual DB Check Block Commented Out
        /*
         * Manual DB Check Removed for Neon/Remote Compatibility
         * The manual connection to 'postgres' database often fails with connection poolers.
         * Relying on context.Database.Migrate() below which is sufficient.
         */ 
          // Manual DB Check Block Commented Out
         /*
        var configuration = services.GetRequiredService<IConfiguration>();
        var connString = configuration.GetConnectionString("DefaultConnection");
        // ... (rest of logic effectively skipped)
        */

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Ensure default database exists before calling Migrate
        try
        {
            var dbConnString = context.Database.GetDbConnection().ConnectionString;
            if (!string.IsNullOrEmpty(dbConnString) && dbConnString.Contains("Host="))
            {
                var connBuilder = new Npgsql.NpgsqlConnectionStringBuilder(dbConnString);
                var dbName = connBuilder.Database;
                if (!string.IsNullOrEmpty(dbName) && dbName != "postgres")
                {
                    var adminCs = dbConnString.Replace($"Database={dbName}", "Database=postgres").Replace($"database={dbName}", "database=postgres");
                    using var conn = new Npgsql.NpgsqlConnection(adminCs);
                    conn.Open();
                    using var checkCmd = new Npgsql.NpgsqlCommand("SELECT 1 FROM pg_database WHERE datname = @dbName;", conn);
                    checkCmd.Parameters.AddWithValue("@dbName", dbName);
                    var exists = checkCmd.ExecuteScalar() != null;
                    if (!exists)
                    {
                        Console.WriteLine($"Database '{dbName}' is missing. Provisioning default database...");
                        using var createCmd = new Npgsql.NpgsqlCommand($"CREATE DATABASE \"{dbName}\";", conn);
                        createCmd.ExecuteNonQuery();
                        Console.WriteLine($"Database '{dbName}' provisioned successfully!");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LMS Startup DB Check] Non-fatal check error: {ex.Message}");
        }

        context.Database.ExecuteSqlRaw("CREATE SCHEMA IF NOT EXISTS quran; SET search_path TO quran;");
        // NOTE: If the model has changed, run `dotnet ef migrations add <Name>` to create a new migration
        // before deploying. The PendingModelChangesWarning is ignored here to allow startup without a
        // pending migration, but a proper migration must be added before production deployment.
        context.Database.Migrate();
        
        var seederConfig = services.GetService<IConfiguration>();
        await BdaeyEducat.API.Seeders.DataSeeder.SeedAsync(context, userManager, roleManager, seederConfig);
    }
    catch (Exception ex)
    {
        // var services = scope.ServiceProvider; // already defined
        // Suppressed throw; to prevent container startup crashes. Fallback is handled on-demand.
        Console.WriteLine($"[LMS Startup Warn] Database initialization warning (non-fatal): {ex.Message}");
    }
     
}

// Health check endpoint for Render to verify instance is up
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();

public class SchemaConnectionInterceptor : Microsoft.EntityFrameworkCore.Diagnostics.DbConnectionInterceptor
{
    private readonly string _schema;
    public SchemaConnectionInterceptor(string schema)
    {
        _schema = schema;
    }

    public override void ConnectionOpened(System.Data.Common.DbConnection connection, Microsoft.EntityFrameworkCore.Diagnostics.ConnectionEndEventData eventData)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"CREATE SCHEMA IF NOT EXISTS {_schema}; SET search_path TO {_schema};";
        command.ExecuteNonQuery();
    }

    public override async System.Threading.Tasks.Task ConnectionOpenedAsync(System.Data.Common.DbConnection connection, Microsoft.EntityFrameworkCore.Diagnostics.ConnectionEndEventData eventData, System.Threading.CancellationToken cancellationToken = default)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"CREATE SCHEMA IF NOT EXISTS {_schema}; SET search_path TO {_schema};";
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
