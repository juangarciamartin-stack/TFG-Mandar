using System.Linq;
using System.Collections.Generic;
using VestaApi.Models; 
using Backend.Data;  
using System;

namespace Backend.DataSeed 
{
    public static class DbInitializer
    {
        public static void Initialize(ApplicationDbContext context)
        { 

            var admin = context.Usuarios.FirstOrDefault(u => u.Email == "admin@vesta.es");
            if (admin == null)
            {
                admin = new Usuario
                {
                    Nombre = "Administrador Sistema",
                    Email = "admin@vesta.es",
                    Rol = "Admin",
                    Dni = "12345678B",         
                    Telefono = "600000000",    
                    Disponibilidad = true,
                    Activo = true
                };
                admin.Password = BCrypt.Net.BCrypt.HashPassword("123456");
                context.Usuarios.Add(admin);
                context.SaveChanges();
            }

            var ayto = context.Ayuntamientos.FirstOrDefault(a => a.Cif == "P2608900C");
            if (ayto == null)
            {
                ayto = new Ayuntamiento
                {
                    NombreMunicipio = "Ayuntamiento de Logroño",
                    Cif = "P2608900C",
                    Direccion = "Avenida de la Paz, 11"
                };
                context.Ayuntamientos.Add(ayto);
                context.SaveChanges(); 
            }

            var usuarioAyto = context.Usuarios.FirstOrDefault(u => u.Email == "ayto@vesta.es");
            if (usuarioAyto == null)
            {
                usuarioAyto = new Usuario
                {
                    Nombre = "Admin Logroño",
                    Email = "ayto@vesta.es",
                    Rol = "Ayuntamiento",
                    Dni = "23456789C",         
                    Telefono = "611111111",    
                    Disponibilidad = true,
                    Activo = true,
                    IdAyuntamiento = ayto.Id 
                };

                usuarioAyto.Password = BCrypt.Net.BCrypt.HashPassword("123456");

                context.Usuarios.Add(usuarioAyto);
                context.SaveChanges();
            }

            var centro1 = context.Centros.FirstOrDefault(c => c.Nombre == "Polideportivo Las Gaunas");
            if (centro1 == null)
            {
                centro1 = new Centro 
                { 
                    Nombre = "Polideportivo Las Gaunas", 
                    Direccion = "Av. de la Moncalvillo, 2",
                    Localidad = "Logroño",
                    IdAyuntamiento = ayto.Id
                };
                context.Centros.Add(centro1);
                context.SaveChanges();
            }

            var juan = context.Usuarios.FirstOrDefault(u => u.Email == "juan@vesta.es");
            if (juan == null)
            {
                juan = new Usuario
                {
                    Nombre = "Juan Garcia", 
                    Email = "juan@vesta.es",
                    Rol = "Trabajador",
                    Dni = "12345678X",
                    Telefono = "600123456",
                    Disponibilidad = true,
                    Activo = true
                };
                juan.Password = BCrypt.Net.BCrypt.HashPassword("123456");

                context.Usuarios.Add(juan);
                context.SaveChanges();
            }

            var maria = context.Usuarios.FirstOrDefault(u => u.Email == "maria@vesta.es");
            if (maria == null)
            {
                maria = new Usuario
                {
                    Nombre = "Maria Lopez",
                    Email = "maria@vesta.es",
                    Rol = "Trabajador",
                    Dni = "87654321M",
                    Telefono = "611987654",
                    Disponibilidad = true,
                    Activo = true
                };
                maria.Password = BCrypt.Net.BCrypt.HashPassword("123456");

                context.Usuarios.Add(maria);
                context.SaveChanges();
            }
        }
    }
}