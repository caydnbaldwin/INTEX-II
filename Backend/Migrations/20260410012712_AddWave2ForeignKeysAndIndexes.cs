using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddWave2ForeignKeysAndIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SafehouseMonthlyMetrics_SafehouseId",
                table: "SafehouseMonthlyMetrics",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Residents_SafehouseId",
                table: "Residents",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessRecordings_ResidentId",
                table: "ProcessRecordings",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_InterventionPlans_ResidentId",
                table: "InterventionPlans",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_InKindDonationItems_DonationId",
                table: "InKindDonationItems",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_ResidentId",
                table: "IncidentReports",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_SafehouseId",
                table: "IncidentReports",
                column: "SafehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_HomeVisitations_ResidentId",
                table: "HomeVisitations",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_HealthWellbeingRecords_ResidentId",
                table: "HealthWellbeingRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationRecords_ResidentId",
                table: "EducationRecords",
                column: "ResidentId");

            migrationBuilder.CreateIndex(
                name: "IX_Donations_SupporterId",
                table: "Donations",
                column: "SupporterId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_DonationId",
                table: "DonationAllocations",
                column: "DonationId");

            migrationBuilder.CreateIndex(
                name: "IX_DonationAllocations_SafehouseId",
                table: "DonationAllocations",
                column: "SafehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_DonationAllocations_Donations_DonationId",
                table: "DonationAllocations",
                column: "DonationId",
                principalTable: "Donations",
                principalColumn: "DonationId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DonationAllocations_Safehouses_SafehouseId",
                table: "DonationAllocations",
                column: "SafehouseId",
                principalTable: "Safehouses",
                principalColumn: "SafehouseId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Donations_Supporters_SupporterId",
                table: "Donations",
                column: "SupporterId",
                principalTable: "Supporters",
                principalColumn: "SupporterId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EducationRecords_Residents_ResidentId",
                table: "EducationRecords",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_HealthWellbeingRecords_Residents_ResidentId",
                table: "HealthWellbeingRecords",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_HomeVisitations_Residents_ResidentId",
                table: "HomeVisitations",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Safehouses_SafehouseId",
                table: "IncidentReports",
                column: "SafehouseId",
                principalTable: "Safehouses",
                principalColumn: "SafehouseId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_InKindDonationItems_Donations_DonationId",
                table: "InKindDonationItems",
                column: "DonationId",
                principalTable: "Donations",
                principalColumn: "DonationId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InterventionPlans_Residents_ResidentId",
                table: "InterventionPlans",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ProcessRecordings_Residents_ResidentId",
                table: "ProcessRecordings",
                column: "ResidentId",
                principalTable: "Residents",
                principalColumn: "ResidentId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Residents_Safehouses_SafehouseId",
                table: "Residents",
                column: "SafehouseId",
                principalTable: "Safehouses",
                principalColumn: "SafehouseId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId",
                table: "SafehouseMonthlyMetrics",
                column: "SafehouseId",
                principalTable: "Safehouses",
                principalColumn: "SafehouseId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DonationAllocations_Donations_DonationId",
                table: "DonationAllocations");

            migrationBuilder.DropForeignKey(
                name: "FK_DonationAllocations_Safehouses_SafehouseId",
                table: "DonationAllocations");

            migrationBuilder.DropForeignKey(
                name: "FK_Donations_Supporters_SupporterId",
                table: "Donations");

            migrationBuilder.DropForeignKey(
                name: "FK_EducationRecords_Residents_ResidentId",
                table: "EducationRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_HealthWellbeingRecords_Residents_ResidentId",
                table: "HealthWellbeingRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_HomeVisitations_Residents_ResidentId",
                table: "HomeVisitations");

            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Residents_ResidentId",
                table: "IncidentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Safehouses_SafehouseId",
                table: "IncidentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_InKindDonationItems_Donations_DonationId",
                table: "InKindDonationItems");

            migrationBuilder.DropForeignKey(
                name: "FK_InterventionPlans_Residents_ResidentId",
                table: "InterventionPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_ProcessRecordings_Residents_ResidentId",
                table: "ProcessRecordings");

            migrationBuilder.DropForeignKey(
                name: "FK_Residents_Safehouses_SafehouseId",
                table: "Residents");

            migrationBuilder.DropForeignKey(
                name: "FK_SafehouseMonthlyMetrics_Safehouses_SafehouseId",
                table: "SafehouseMonthlyMetrics");

            migrationBuilder.DropIndex(
                name: "IX_SafehouseMonthlyMetrics_SafehouseId",
                table: "SafehouseMonthlyMetrics");

            migrationBuilder.DropIndex(
                name: "IX_Residents_SafehouseId",
                table: "Residents");

            migrationBuilder.DropIndex(
                name: "IX_ProcessRecordings_ResidentId",
                table: "ProcessRecordings");

            migrationBuilder.DropIndex(
                name: "IX_InterventionPlans_ResidentId",
                table: "InterventionPlans");

            migrationBuilder.DropIndex(
                name: "IX_InKindDonationItems_DonationId",
                table: "InKindDonationItems");

            migrationBuilder.DropIndex(
                name: "IX_IncidentReports_ResidentId",
                table: "IncidentReports");

            migrationBuilder.DropIndex(
                name: "IX_IncidentReports_SafehouseId",
                table: "IncidentReports");

            migrationBuilder.DropIndex(
                name: "IX_HomeVisitations_ResidentId",
                table: "HomeVisitations");

            migrationBuilder.DropIndex(
                name: "IX_HealthWellbeingRecords_ResidentId",
                table: "HealthWellbeingRecords");

            migrationBuilder.DropIndex(
                name: "IX_EducationRecords_ResidentId",
                table: "EducationRecords");

            migrationBuilder.DropIndex(
                name: "IX_Donations_SupporterId",
                table: "Donations");

            migrationBuilder.DropIndex(
                name: "IX_DonationAllocations_DonationId",
                table: "DonationAllocations");

            migrationBuilder.DropIndex(
                name: "IX_DonationAllocations_SafehouseId",
                table: "DonationAllocations");
        }
    }
}
