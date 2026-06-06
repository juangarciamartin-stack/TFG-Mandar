using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class VincularIncidenciasOpcional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Incidencias",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidencias_EmpresaId",
                table: "Incidencias",
                column: "EmpresaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidencias_Empresas_EmpresaId",
                table: "Incidencias",
                column: "EmpresaId",
                principalTable: "Empresas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidencias_Empresas_EmpresaId",
                table: "Incidencias");

            migrationBuilder.DropIndex(
                name: "IX_Incidencias_EmpresaId",
                table: "Incidencias");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Incidencias");
        }
    }
}
