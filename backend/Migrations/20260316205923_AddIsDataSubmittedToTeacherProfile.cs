using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BdaeyEducat.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDataSubmittedToTeacherProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDataSubmitted",
                table: "TeacherProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDataSubmitted",
                table: "TeacherProfiles");
        }
    }
}
