using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgendaMarcada.Infrastructure.Persistencia.Migrations
{
    /// <inheritdoc />
    public partial class SlugUnico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Empresas_Slug",
                table: "Empresas",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Empresas_Slug",
                table: "Empresas");
        }
    }
}
