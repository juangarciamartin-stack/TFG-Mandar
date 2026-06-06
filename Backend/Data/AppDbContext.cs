using Microsoft.EntityFrameworkCore;
using VestaApi.Models;

namespace Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
            : base(options)
        {
        }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Ayuntamiento> Ayuntamientos { get; set; }
        public DbSet<Centro> Centros { get; set; }
        public DbSet<Empresa> Empresas { get; set; }
        public DbSet<Incidencia> Incidencias { get; set; }
        public DbSet<Lote> Lotes { get; set; }
        public DbSet<Nomina> Nominas { get; set; }
        public DbSet<Pliego> Pliegos { get; set; }
        public DbSet<UsuarioEmpresa> UsuarioEmpresas { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // Relacion Lote - Centros (Muchos a Muchos)
    modelBuilder.Entity<Lote>()
        .HasMany(l => l.Centros)
        .WithMany(c => c.Lotes)
        .UsingEntity(j => j.ToTable("Centro_Lote"));

    //Relacion Lote - Pliegos (1 a Muchos)
    modelBuilder.Entity<Pliego>()
        .HasOne(p => p.Lote)
        .WithMany(l => l.Pliegos)
        .HasForeignKey(p => p.IdLote);
}
}
}