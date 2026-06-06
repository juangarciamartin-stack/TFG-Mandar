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
            //Admin
            var admin = context.Usuarios.FirstOrDefault(u => u.Email == "admin@vesta.es");
            if (admin == null)
            {
                admin = new Usuario
                {
                    Nombre = "Administrador Sistema",
                    Email = "admin@vesta.es",
                    Password = "1234",
                    Rol = "Admin",
                    Dni = "00000000T",
                    Telefono = "000000000",
                    Disponibilidad = true
                };
                context.Usuarios.Add(admin);
                context.SaveChanges();
            }

            // Ayuntamiento con su login
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
                    Email = "ayto@vesta.es",
                    Password = "1234",
                    Nombre = "Admin Logroño",
                    Rol = "Ayuntamiento",
                    Dni = "00000001A",
                    Telefono = "600000000",
                    Disponibilidad = true,
                    IdAyuntamiento = ayto.Id 
                };

                context.Usuarios.Add(usuarioAyto);
                context.SaveChanges();
            }

            //Centros
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

            //Trabajador 1 (Juan libre / sin empresa)
            var juan = context.Usuarios.FirstOrDefault(u => u.Email == "juan@vesta.es");
            if (juan == null)
            {
                juan = new Usuario
                {
                    Nombre = "Juan García",
                    Email = "juan@vesta.es",
                    Password = "1234",
                    Rol = "Trabajador",
                    Dni = "12345678X",
                    Telefono = "600123456",
                    Disponibilidad = true
                };
                context.Usuarios.Add(juan);
                context.SaveChanges();
            }

            //Trabajador 2: (Maria libre / sin empresa)
            var maria = context.Usuarios.FirstOrDefault(u => u.Email == "maria@vesta.es");
            if (maria == null)
            {
                maria = new Usuario
                {
                    Nombre = "María López",
                    Email = "maria@vesta.es",
                    Password = "1234",
                    Rol = "Trabajador",
                    Dni = "87654321M",
                    Telefono = "611987654",
                    Disponibilidad = true
                };
                context.Usuarios.Add(maria);
                context.SaveChanges();
            }
            context.SaveChanges();
        }
    }
}