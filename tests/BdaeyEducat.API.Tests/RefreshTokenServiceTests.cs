using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace BdaeyEducat.API.Tests;

public class RefreshTokenServiceTests
{
    private static ApplicationDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static RefreshTokenService CreateService(ApplicationDbContext context, double refreshDays = 14)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:RefreshTokenDays"] = refreshDays.ToString(System.Globalization.CultureInfo.InvariantCulture)
            })
            .Build();
        return new RefreshTokenService(context, config, NullLogger<RefreshTokenService>.Instance);
    }

    private static async Task<ApplicationUser> SeedUser(ApplicationDbContext context, string id = "user-1")
    {
        var user = new ApplicationUser { Id = id, UserName = id, Email = $"{id}@test.com", FullName = "Test User" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task CreateAsync_StoresOnlyHash_NeverRawToken()
    {
        using var context = CreateContext();
        var user = await SeedUser(context);

        var raw = await CreateService(context).CreateAsync(user);

        Assert.False(string.IsNullOrWhiteSpace(raw));
        var stored = await context.RefreshTokens.SingleAsync();
        Assert.Equal(user.Id, stored.UserId);
        Assert.NotEqual(raw, stored.TokenHash);
        Assert.Equal(64, stored.TokenHash.Length); // SHA-256 hex
        Assert.True(stored.ExpiresAt > DateTime.UtcNow.AddDays(13));
    }

    [Fact]
    public async Task RotateAsync_ValidToken_ReturnsNewToken_AndRevokesOld()
    {
        using var context = CreateContext();
        var user = await SeedUser(context);
        var service = CreateService(context);
        var raw = await service.CreateAsync(user);

        var result = await service.RotateAsync(raw);

        Assert.True(result.Success);
        Assert.NotNull(result.NewRawToken);
        Assert.NotEqual(raw, result.NewRawToken);
        Assert.Equal(user.Id, result.User?.Id);

        var tokens = await context.RefreshTokens.OrderBy(t => t.Id).ToListAsync();
        Assert.Equal(2, tokens.Count);
        Assert.NotNull(tokens[0].RevokedAt);
        Assert.Equal("Rotated", tokens[0].RevokeReason);
        Assert.Equal(tokens[1].TokenHash, tokens[0].ReplacedByTokenHash);
        Assert.Null(tokens[1].RevokedAt);
    }

    [Fact]
    public async Task RotateAsync_UnknownToken_Fails()
    {
        using var context = CreateContext();
        var result = await CreateService(context).RotateAsync("does-not-exist");

        Assert.False(result.Success);
    }

    [Fact]
    public async Task RotateAsync_ReusedRevokedToken_RevokesEverySessionOfUser()
    {
        using var context = CreateContext();
        var user = await SeedUser(context);
        var service = CreateService(context);

        // Two independent sessions (e.g. phone + laptop)
        var sessionA = await service.CreateAsync(user);
        var sessionB = await service.CreateAsync(user);

        // Rotate A legitimately, then present A again (reuse = possible theft)
        var rotated = await service.RotateAsync(sessionA);
        Assert.True(rotated.Success);

        var reuse = await service.RotateAsync(sessionA);
        Assert.False(reuse.Success);

        // Every active session must be dead now, including B and the rotated A'
        var activeTokens = await context.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .ToListAsync();
        Assert.Empty(activeTokens);

        // The untouched session B is unusable too
        var bResult = await service.RotateAsync(sessionB);
        Assert.False(bResult.Success);
    }

    [Fact]
    public async Task RotateAsync_ExpiredToken_Fails()
    {
        using var context = CreateContext();
        var user = await SeedUser(context);
        var service = CreateService(context);
        var raw = await service.CreateAsync(user);

        var stored = await context.RefreshTokens.SingleAsync();
        stored.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
        await context.SaveChangesAsync();

        var result = await service.RotateAsync(raw);
        Assert.False(result.Success);
        Assert.Contains("expired", result.Error, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task RevokeAsync_ActiveToken_CannotBeRotatedAfterwards()
    {
        using var context = CreateContext();
        var user = await SeedUser(context);
        var service = CreateService(context);
        var raw = await service.CreateAsync(user);

        await service.RevokeAsync(raw, "User logged out");

        var result = await service.RotateAsync(raw);
        Assert.False(result.Success);
    }

    [Fact]
    public async Task RevokeAsync_UnknownToken_DoesNotThrow()
    {
        using var context = CreateContext();
        await CreateService(context).RevokeAsync("unknown-token", "test");
    }
}
