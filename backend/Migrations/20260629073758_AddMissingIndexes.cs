using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StudentBadges_StudentId",
                schema: "quran",
                table: "StudentBadges");

            migrationBuilder.DropIndex(
                name: "IX_SessionEvaluations_SessionId",
                schema: "quran",
                table: "SessionEvaluations");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookingId",
                schema: "quran",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_PromoCodeUsages_PromoCodeId",
                schema: "quran",
                table: "PromoCodeUsages");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId",
                schema: "quran",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SenderId",
                schema: "quran",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "PaymentDetailsJson",
                schema: "quran",
                table: "WithdrawalRequests");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NationalId",
                schema: "quran",
                table: "Users",
                column: "NationalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentBadges_StudentId_BadgeId",
                schema: "quran",
                table: "StudentBadges",
                columns: new[] { "StudentId", "BadgeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionEvaluations_SessionId",
                schema: "quran",
                table: "SessionEvaluations",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId_StudentId",
                schema: "quran",
                table: "Reviews",
                columns: new[] { "BookingId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PromoCodeUsages_PromoCodeId_UserId",
                schema: "quran",
                table: "PromoCodeUsages",
                columns: new[] { "PromoCodeId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAt",
                schema: "quran",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_IsRead_CreatedAt",
                schema: "quran",
                table: "ContactMessages",
                columns: new[] { "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId_ReceiverId",
                schema: "quran",
                table: "ChatMessages",
                columns: new[] { "SenderId", "ReceiverId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_TargetEntity_CreatedAt",
                schema: "quran",
                table: "AuditLogs",
                columns: new[] { "TargetEntity", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_NationalId",
                schema: "quran",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_StudentBadges_StudentId_BadgeId",
                schema: "quran",
                table: "StudentBadges");

            migrationBuilder.DropIndex(
                name: "IX_SessionEvaluations_SessionId",
                schema: "quran",
                table: "SessionEvaluations");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_BookingId_StudentId",
                schema: "quran",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_PromoCodeUsages_PromoCodeId_UserId",
                schema: "quran",
                table: "PromoCodeUsages");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAt",
                schema: "quran",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_ContactMessages_IsRead_CreatedAt",
                schema: "quran",
                table: "ContactMessages");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_SenderId_ReceiverId",
                schema: "quran",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_TargetEntity_CreatedAt",
                schema: "quran",
                table: "AuditLogs");

            migrationBuilder.AddColumn<string>(
                name: "PaymentDetailsJson",
                schema: "quran",
                table: "WithdrawalRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_StudentBadges_StudentId",
                schema: "quran",
                table: "StudentBadges",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionEvaluations_SessionId",
                schema: "quran",
                table: "SessionEvaluations",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_BookingId",
                schema: "quran",
                table: "Reviews",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PromoCodeUsages_PromoCodeId",
                schema: "quran",
                table: "PromoCodeUsages",
                column: "PromoCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                schema: "quran",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId",
                schema: "quran",
                table: "ChatMessages",
                column: "SenderId");
        }
    }
}
