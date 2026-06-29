using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailConfirmationSentAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailConfirmationSentAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailConfirmationSentAt",
                table: "Users");
        }
    }
}
