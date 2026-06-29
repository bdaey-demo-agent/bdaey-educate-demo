using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "quran");

            migrationBuilder.RenameTable(
                name: "WithdrawalRequests",
                newName: "WithdrawalRequests",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "WithdrawalMethods",
                newName: "WithdrawalMethods",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "WalletTransactions",
                newName: "WalletTransactions",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Wallets",
                newName: "Wallets",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "Users",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "TeacherProfiles",
                newName: "TeacherProfiles",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "StudentBadges",
                newName: "StudentBadges",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Sessions",
                newName: "Sessions",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "SessionEvaluations",
                newName: "SessionEvaluations",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Reviews",
                newName: "Reviews",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "PromoCodeUsages",
                newName: "PromoCodeUsages",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "PromoCodes",
                newName: "PromoCodes",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "PlatformSettings",
                newName: "PlatformSettings",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Packages",
                newName: "Packages",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Notifications",
                newName: "Notifications",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "FavoriteTeachers",
                newName: "FavoriteTeachers",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "ContactMessages",
                newName: "ContactMessages",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "ChatMessages",
                newName: "ChatMessages",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Bookings",
                newName: "Bookings",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "Badges",
                newName: "Badges",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AuditLogs",
                newName: "AuditLogs",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetUserTokens",
                newName: "AspNetUserTokens",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetUserRoles",
                newName: "AspNetUserRoles",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetUserLogins",
                newName: "AspNetUserLogins",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetUserClaims",
                newName: "AspNetUserClaims",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetRoles",
                newName: "AspNetRoles",
                newSchema: "quran");

            migrationBuilder.RenameTable(
                name: "AspNetRoleClaims",
                newName: "AspNetRoleClaims",
                newSchema: "quran");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "WithdrawalRequests",
                schema: "quran",
                newName: "WithdrawalRequests");

            migrationBuilder.RenameTable(
                name: "WithdrawalMethods",
                schema: "quran",
                newName: "WithdrawalMethods");

            migrationBuilder.RenameTable(
                name: "WalletTransactions",
                schema: "quran",
                newName: "WalletTransactions");

            migrationBuilder.RenameTable(
                name: "Wallets",
                schema: "quran",
                newName: "Wallets");

            migrationBuilder.RenameTable(
                name: "Users",
                schema: "quran",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "TeacherProfiles",
                schema: "quran",
                newName: "TeacherProfiles");

            migrationBuilder.RenameTable(
                name: "StudentBadges",
                schema: "quran",
                newName: "StudentBadges");

            migrationBuilder.RenameTable(
                name: "Sessions",
                schema: "quran",
                newName: "Sessions");

            migrationBuilder.RenameTable(
                name: "SessionEvaluations",
                schema: "quran",
                newName: "SessionEvaluations");

            migrationBuilder.RenameTable(
                name: "Reviews",
                schema: "quran",
                newName: "Reviews");

            migrationBuilder.RenameTable(
                name: "PromoCodeUsages",
                schema: "quran",
                newName: "PromoCodeUsages");

            migrationBuilder.RenameTable(
                name: "PromoCodes",
                schema: "quran",
                newName: "PromoCodes");

            migrationBuilder.RenameTable(
                name: "PlatformSettings",
                schema: "quran",
                newName: "PlatformSettings");

            migrationBuilder.RenameTable(
                name: "Packages",
                schema: "quran",
                newName: "Packages");

            migrationBuilder.RenameTable(
                name: "Notifications",
                schema: "quran",
                newName: "Notifications");

            migrationBuilder.RenameTable(
                name: "FavoriteTeachers",
                schema: "quran",
                newName: "FavoriteTeachers");

            migrationBuilder.RenameTable(
                name: "ContactMessages",
                schema: "quran",
                newName: "ContactMessages");

            migrationBuilder.RenameTable(
                name: "ChatMessages",
                schema: "quran",
                newName: "ChatMessages");

            migrationBuilder.RenameTable(
                name: "Bookings",
                schema: "quran",
                newName: "Bookings");

            migrationBuilder.RenameTable(
                name: "Badges",
                schema: "quran",
                newName: "Badges");

            migrationBuilder.RenameTable(
                name: "AuditLogs",
                schema: "quran",
                newName: "AuditLogs");

            migrationBuilder.RenameTable(
                name: "AspNetUserTokens",
                schema: "quran",
                newName: "AspNetUserTokens");

            migrationBuilder.RenameTable(
                name: "AspNetUserRoles",
                schema: "quran",
                newName: "AspNetUserRoles");

            migrationBuilder.RenameTable(
                name: "AspNetUserLogins",
                schema: "quran",
                newName: "AspNetUserLogins");

            migrationBuilder.RenameTable(
                name: "AspNetUserClaims",
                schema: "quran",
                newName: "AspNetUserClaims");

            migrationBuilder.RenameTable(
                name: "AspNetRoles",
                schema: "quran",
                newName: "AspNetRoles");

            migrationBuilder.RenameTable(
                name: "AspNetRoleClaims",
                schema: "quran",
                newName: "AspNetRoleClaims");
        }
    }
}
