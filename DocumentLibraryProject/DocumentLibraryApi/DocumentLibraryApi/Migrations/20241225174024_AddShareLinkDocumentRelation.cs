using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocumentLibraryApi.Migrations
{
    /// <inheritdoc />
    public partial class AddShareLinkDocumentRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ShareLinks_DocumentId",
                table: "ShareLinks",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShareLinks_Documents_DocumentId",
                table: "ShareLinks",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShareLinks_Documents_DocumentId",
                table: "ShareLinks");

            migrationBuilder.DropIndex(
                name: "IX_ShareLinks_DocumentId",
                table: "ShareLinks");
        }
    }
}
