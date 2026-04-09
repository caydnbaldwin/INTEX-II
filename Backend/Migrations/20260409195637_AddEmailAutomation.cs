using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailAutomation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AutomationStates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Enabled = table.Column<bool>(type: "bit", nullable: false),
                    LastRun = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EmailsThisWeek = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AutomationStates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Trigger = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastEdited = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastEditedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.TemplateId);
                });

            migrationBuilder.CreateTable(
                name: "OutreachEmailLogs",
                columns: table => new
                {
                    OutreachEmailLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SupporterId = table.Column<int>(type: "int", nullable: false),
                    DonorName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TemplateId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutreachEmailLogs", x => x.OutreachEmailLogId);
                });

            migrationBuilder.InsertData(
                table: "AutomationStates",
                columns: new[] { "Id", "EmailsThisWeek", "Enabled", "LastRun" },
                values: new object[] { 1, 0, false, null });

            migrationBuilder.InsertData(
                table: "EmailTemplates",
                columns: new[] { "TemplateId", "Body", "Description", "LastEdited", "LastEditedBy", "Name", "Subject", "Trigger" },
                values: new object[,]
                {
                    { "first_time", "{{first_name}},\n\nYou are making a difference. Thank you for your generous gift to Lunas Foundation — it means more than you know. Your donation has gone toward {{program_area}}, directly supporting girls who had nowhere else to turn.\n\nWe are growing and working hard to reach even more girls who need us. A donation of {{suggested_amount}} would help us continue that work. Every contribution, no matter the size, goes directly to protecting and empowering the girls in our care.\n\n{{donate_button}}\n\n— Lunas Project", "1-2 gifts — welcome tone", new DateTime(2026, 4, 8, 0, 0, 0, 0, DateTimeKind.Utc), "system", "First-Time Donors", "{{first_name}}, your gift is already making an impact", "frequency <= 2" },
                    { "loyal", "{{first_name}},\n\nYou are making a difference. We are so grateful for your commitment to these girls. You are one of our best supporters — your {{frequency}} heartfelt donations have helped fund {{program_area}}, supported girls through some of their hardest moments, and kept our doors open for those who need us most.\n\nWe are growing more than ever and working to reach more girls across the Philippines. Right now we are in need of funding for {{program_area}}, and even a donation of {{suggested_amount}} would help us get closer to our goal. Anything you give goes a long way to protecting our girls.\n\n{{donate_button}}\n\n— Lunas Project", "3+ gifts — partner-level tone", new DateTime(2026, 4, 8, 0, 0, 0, 0, DateTimeKind.Utc), "system", "Loyal Donors", "You're making a difference, {{first_name}}", "frequency >= 3" },
                    { "win_back", "{{first_name}},\n\nYou made a difference — and we haven't forgotten it. Your past generosity helped fund {{program_area}} and supported girls during some of their most vulnerable moments. That gift mattered then, and it still matters now.\n\nA lot has happened since your last donation. We are reaching more girls than ever and growing every month — but we need supporters like you to keep going. Even a gift of {{suggested_amount}} would help us continue the work you helped start.\n\n{{donate_button}}\n\n— Lunas Project", "90+ days since last gift — reactivation tone", new DateTime(2026, 4, 8, 0, 0, 0, 0, DateTimeKind.Utc), "system", "Win-Back", "We miss you, {{first_name}}", "recency > 90" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AutomationStates");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "OutreachEmailLogs");
        }
    }
}
