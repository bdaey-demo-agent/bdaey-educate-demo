using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using System;

namespace BdaeyEducat.API.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration? config = null)
    {
        var adminEmail = config?["Admin:Email"] 
            ?? Environment.GetEnvironmentVariable("Admin__Email") 
            ?? Environment.GetEnvironmentVariable("Admin:Email") 
            ?? Environment.GetEnvironmentVariable("ADMIN_EMAIL") 
            ?? "admin@bdaey.com";

        var adminPassword = config?["Admin:Password"] 
            ?? Environment.GetEnvironmentVariable("Admin__Password") 
            ?? Environment.GetEnvironmentVariable("Admin:Password") 
            ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

        string[] roles = { "Admin", "Teacher", "Student" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        if (string.IsNullOrEmpty(adminPassword))
        {
            Console.WriteLine("[Seeder] Admin password not provided in environment variables (Admin__Password / Admin:Password). Skipping admin user creation.");
            return;
        }

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            var newAdmin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FullName = "Admin User"
            };
            var result = await userManager.CreateAsync(newAdmin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newAdmin, "Admin");
            }
        }

        if (!await context.PlatformSettings.AnyAsync(s => s.Key == "GlobalCommission"))
        {
            context.PlatformSettings.Add(new PlatformSetting
            {
                Key = "GlobalCommission",
                Value = config?["Seeder:GlobalCommission"] ?? "15.0",
                Description = "النسبة المئوية لعمولة المنصة الافتراضية"
            });
        }

        if (!await context.PlatformSettings.AnyAsync(s => s.Key == "PackageDeletionPenalty"))
        {
            context.PlatformSettings.Add(new PlatformSetting
            {
                Key = "PackageDeletionPenalty",
                Value = config?["Seeder:PackageDeletionPenalty"] ?? "50.0",
                Description = "قيمة الغرامة الافتراضية عند حذف باقة نشطة"
            });
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Core system data (Roles/Admin/Settings) seeded successfully.");
    }
}
