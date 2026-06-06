Proyecto VESTA (TFG) - Avances del Desarrollo
Parte 1: Frontend
Tecnología usada: React + Vite + CSS puro.

Creación del proyecto base: Se inicializó el proyecto usando Vite (npm create vite@latest) por ser el empaquetador más rápido y moderno del ecosistema React.

Estructura de componentes: Se adoptó una arquitectura basada en componentes (carpeta src/components y src/pages) para mantener el código modular y reutilizable.

Maquetación del Dashboard: \* Se implementó un diseño flexbox para separar el menú lateral (Sidebar) del contenido principal (Dashboard).

Se crearon componentes visuales basados en el prototipo de Figma.

Módulo de Gestión de Nóminas:

Implementación del servicio nominaService.js mediante Axios para consumir la API protegida.

Creación de la vista Nominas.jsx con tabla de datos, manejo de errores y descarga de archivos PDF.

Actualización en App.jsx para proteger rutas según el rol (ej. Trabajador).

Parte 2: Backend
Tecnología usada: .NET 10 (C#) + PostgreSQL + Entity Framework Core.

Pasos de inicialización:
Creación de la API:

Comando: dotnet new webapi --force

¿Por qué? Este comando genera el esqueleto oficial de una API REST en C# (crea el archivo .csproj que gestiona el proyecto y el Program.cs que es el punto de entrada). Usamos --force para sobreescribir archivos huérfanos anteriores.

Instalación del proveedor de Base de Datos (PostgreSQL):

Comando: dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

¿Por qué? Entity Framework (el ORM de C#) necesita saber a qué base de datos nos vamos a conectar. Este paquete es el "traductor" oficial que convierte el código C# a consultas SQL que PostgreSQL pueda entender.

Instalación de las herramientas de diseño (Migrations):

Comando: dotnet add package Microsoft.EntityFrameworkCore.Design

¿Por qué? Este paquete es vital para trabajar con "Code-First". Nos permitirá escribir nuestro esquema de base de datos en C# (nuestras clases) y que la herramienta genere automáticamente las tablas en PostgreSQL (mediante el comando dotnet ef migrations add).

Configuración de la Cadena de Conexión:

Se añadió el bloque ConnectionStrings en el archivo appsettings.json.

¿Por qué? Siguiendo las buenas prácticas de seguridad, las credenciales de la base de datos (Host, Puerto, Usuario y Contraseña) nunca se escriben directamente en el código fuente de C#, sino en este archivo de configuración externo. Así es más fácil cambiar de base de datos al pasar el proyecto a producción.

Configuración de CORS:

Se habilitó la política CORS en Program.cs para permitir peticiones entre los puertos de React y .NET sin bloqueos de origen cruzado.

🛠️ Entorno de Desarrollo (Base de Datos)
Instalación de PostgreSQL: En el entorno local (Mac), se utilizó Postgres.app por su simplicidad y aislamiento del sistema operativo.

Credenciales locales: En entornos de desarrollo con Postgres.app, el servidor se ejecuta en localhost:5432, utilizando el nombre de usuario del sistema operativo y sin contraseña por defecto, lo que agiliza las pruebas locales.

🚀 Hito: Configuración del Backend y Creación de la Base de Datos (Code-First)
Objetivo: Levantar el servidor backend en .NET Core, configurar las herramientas de Entity Framework (EF) y generar la estructura relacional en PostgreSQL mediante el enfoque "Code-First".

Pasos realizados y problemas resueltos:

Arranque inicial de la API: Se comprobó que el servidor compilaba y escuchaba correctamente en localhost:5125.

Diseño del Dominio (Models): Se crearon las entidades principales de la aplicación en la carpeta Models (Ayuntamiento, Empresa, Personal, Lote, etc.), implementando herencia (ej. Ayuntamiento hereda de Usuario) y relaciones.

Configuración del DbContext: Se creó la clase ApplicationDbContext mapeando cada modelo a un DbSet<T> para representar las futuras tablas de la base de datos.

Resolución de problemas de Entorno (macOS): \* Error: dotnet-ef command not found.

Solución: Se instaló la herramienta globalmente y se añadió la ruta ~/.dotnet/tools a la variable de entorno $PATH en el terminal de Mac para que el sistema reconociera los comandos de EF Core.

Resolución de errores de Compilación (Namespaces): \* Problema: El compilador no encontraba los modelos dentro del DbContext.

Solución: Se unificaron los espacios de nombres (namespaces), asegurando que ApplicationDbContext importara correctamente using VestaApi.Models;.

Configuración de Inyección de Dependencias (Program.cs): \* Problema: Fallos al inyectar el DbContext y referencias faltantes de Swagger.

Solución: Se limpió Program.cs, eliminando dependencias no instaladas y asegurando que builder.Services.AddDbContext<ApplicationDbContext> coincidiera exactamente con el nombre de la clase y su namespace.

Generación de la Base de Datos Físicas:

Se ejecutó dotnet ef migrations add MigracionInicial para crear el código C# con las instrucciones SQL.

Se ejecutó dotnet ef database update. Este comando detectó que la base de datos VestaDB no existía, la creó desde cero en PostgreSQL y desplegó todas las tablas, columnas, relaciones (Foreign Keys) e índices de manera exitosa.

📋 Requisitos de la Aplicación
Requisitos Funcionales
Gestión administrativa multi-rol: CRUD de ayuntamientos, centros/colegios, empresas y sindicatos.

Módulo de licitaciones: Organización de centros por lotes administrativos y sus correspondientes pliegos de condiciones.

Transparencia sindical: Acceso específico para representantes de los trabajadores donde podrán consultar el listado de personal, horas y notas de incidencias para asegurar el cumplimiento de los pliegos.

Control de personal: Registro detallado de encargados y empleados (nombre, móvil, notas, centro asignado y empresa actual).

Portal de empleo público: Un apartado abierto para que ciudadanos consulten qué empresa gestiona cada centro y puedan enviar su CV directamente a la empresa encargada.

Seguridad avanzada: Sistema de autenticación con diferentes niveles de visibilidad según el perfil (admin, empresa, sindicato, público).

Requisitos No Funcionales
Seguridad y Privacidad de Datos:

Protección de datos (RGPD): El almacenamiento y tratamiento de los currículums (CV) y datos personales de los ciudadanos debe cumplir con la normativa de protección de datos.

Cifrado de información: Las contraseñas deben almacenarse utilizando algoritmos de hashing seguros (como bcrypt o Argon2). Los datos sensibles transmitidos por la red deben ir bajo el protocolo HTTPS.

Trazabilidad: El sistema debe registrar los accesos críticos (especialmente en los módulos de transparencia y control de personal) para auditorías.

Rendimiento y Disponibilidad:

Tiempo de respuesta: Las consultas y transacciones habituales deben resolverse en menos de 2 segundos.

Disponibilidad del portal: El portal de empleo público y las áreas de consulta deben tener una disponibilidad del 99,5% (operativo 24/7).

Usabilidad y Accesibilidad:

Diseño responsivo: La interfaz debe ser plenamente funcional tanto en equipos de escritorio como en dispositivos móviles.

Accesibilidad web: Cumplimiento de los estándares WCAG 2.1 (nivel AA) para asegurar que el portal sea accesible para todos los ciudadanos.

Escalabilidad y Mantenibilidad:

Escalabilidad: La arquitectura debe permitir añadir nuevos ayuntamientos, centros y lotes administrativos sin degradar el rendimiento del servidor.

Modularidad: El sistema debe estar desacoplado para facilitar futuras actualizaciones en módulos específicos.
