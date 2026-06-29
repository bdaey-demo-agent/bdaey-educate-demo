using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledCommissionToTeacherProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ScheduledCommissionRate",
                table: "TeacherProfiles",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledCommissionUntil",
                table: "TeacherProfiles",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledCommissionRate",
                table: "TeacherProfiles");

            migrationBuilder.DropColumn(
                name: "ScheduledCommissionUntil",
                table: "TeacherProfiles");
        }
    }
}
