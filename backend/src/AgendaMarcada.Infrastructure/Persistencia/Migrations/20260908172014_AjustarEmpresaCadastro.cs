using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AgendaMarcada.Infrastructure.Persistencia.Migrations
{
    /// <inheritdoc />
    public partial class AjustarEmpresaCadastro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Documento",
                table: "Empresas");

            migrationBuilder.RenameColumn(
                name: "NomeFantasia",
                table: "Empresas",
                newName: "NomeResponsavel");

            migrationBuilder.RenameColumn(
                name: "Nome",
                table: "Empresas",
                newName: "NomeNegocio");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "NomeResponsavel",
                table: "Empresas",
                newName: "NomeFantasia");

            migrationBuilder.RenameColumn(
                name: "NomeNegocio",
                table: "Empresas",
                newName: "Nome");

            migrationBuilder.AddColumn<string>(
                name: "Documento",
                table: "Empresas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
