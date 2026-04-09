using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardingPlacements",
                columns: table => new
                {
                    BoardingPlacementId = table.Column<int>(type: "int", nullable: false),
                    ResidentId = table.Column<int>(type: "int", nullable: true),
                    SafehouseId = table.Column<int>(type: "int", nullable: true),
                    PlacementStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfidentialResidentName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BedLabel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExpectedCheckIn = table.Column<DateOnly>(type: "date", nullable: true),
                    ExpectedCheckOut = table.Column<DateOnly>(type: "date", nullable: true),
                    ActualCheckIn = table.Column<DateOnly>(type: "date", nullable: true),
                    ActualCheckOut = table.Column<DateOnly>(type: "date", nullable: true),
                    Sensitivities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SpecialConsiderations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RelationshipSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChildrenSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlacementNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardingPlacements", x => x.BoardingPlacementId);
                    table.ForeignKey(
                        name: "FK_BoardingPlacements_Residents_ResidentId",
                        column: x => x.ResidentId,
                        principalTable: "Residents",
                        principalColumn: "ResidentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BoardingPlacements_Safehouses_SafehouseId",
                        column: x => x.SafehouseId,
                        principalTable: "Safehouses",
                        principalColumn: "SafehouseId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BoardingStandingOrders",
                columns: table => new
                {
                    BoardingStandingOrderId = table.Column<int>(type: "int", nullable: false),
                    BoardingPlacementId = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardingStandingOrders", x => x.BoardingStandingOrderId);
                    table.ForeignKey(
                        name: "FK_BoardingStandingOrders_BoardingPlacements_BoardingPlacementId",
                        column: x => x.BoardingPlacementId,
                        principalTable: "BoardingPlacements",
                        principalColumn: "BoardingPlacementId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardingPlacements_ResidentId",
                table: "BoardingPlacements",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardingPlacements_SafehouseId",
                table: "BoardingPlacements",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardingStandingOrders_BoardingPlacementId",
                table: "BoardingStandingOrders",
                column: "BoardingPlacementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardingStandingOrders");

            migrationBuilder.DropTable(
                name: "BoardingPlacements");
        }
    }
}
