using Backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260409170000_AddIncidentAssignments")]
    public partial class AddIncidentAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedStaffDisplayName",
                table: "IncidentReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedStaffUserId",
                table: "IncidentReports",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedStaffDisplayName",
                table: "IncidentReports");

            migrationBuilder.DropColumn(
                name: "AssignedStaffUserId",
                table: "IncidentReports");
        }
    }
}
