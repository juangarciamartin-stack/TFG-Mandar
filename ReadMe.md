Proyecto VESTA (TFG)
Plataforma Unificada para la Gestión de Licitaciones, Control de Personal y Transparencia Sindical en la Administración Pública.

VESTA es una aplicación web de nivel empresarial desarrollada como Trabajo de Fin de Grado (TFG). Su objetivo principal es digitalizar y automatizar los procesos de contratación, adjudicación de lotes y supervisión de pliegos de condiciones entre Ayuntamientos, Empresas Concesionarias, Sindicatos y Ciudadanos.

Arquitectura General del Sistema
El sistema adopta una arquitectura desacoplada Frontend-Backend (Client-Server) que garantiza la modularidad, facilidad de mantenimiento y escalabilidad del software.

vesta-TFG/
├── Backend/     # API REST en .NET 10 (C#) con EF Core y PostgreSQL
└── Frontend/    # Aplicación SPA en React + Vite con CSS Puro

Parte 1: Frontend (Cliente Web)
El módulo cliente ha sido desarrollado bajo el enfoque de Single Page Application (SPA), priorizando la velocidad de carga y una experiencia de usuario fluida y responsiva.

Tecnologías Utilizadas
React 18 (Librería principal para interfaces de usuario declarativas).

Vite (Emmet/Bundler de última generación para un entorno de desarrollo ultrarrápido).

CSS Puro (Flexbox y CSS Variables para una maquetación ligera y libre de dependencias externas).

Axios / Fetch (Consumo de servicios asíncronos de la API).

Avances e Implementaciones Realizadas
Inicialización Base con Vite: Se descartó Create React App a favor de Vite (npm create vite@latest) para optimizar el empaquetado y beneficiarse del Hot Module Replacement (HMR) inmediato.

Estructura Arquitectónica Modular: Organización del código basada en componentes atómicos y reutilizables dentro del ecosistema de React:

src/components/: Componentes globales y transversales (Sidebar, Navbar, Tablas reutilizables).

src/pages/: Vistas de nivel de página vinculadas al enrutador (Login.jsx, Ayuntamientos.jsx, Empresas.jsx, etc.).

Maquetación del Dashboard Principal: Implementación de un diseño estructurado con Flexbox, separando dinámicamente el menú lateral (Sidebar) del área de trabajo del contenido principal siguiendo fielmente los prototipos vectoriales de Figma.

Módulo de Gestión de Nóminas:

Implementación de un servicio dedicado (nominaService.js) con manejo de interceptores para inyectar tokens JWT en las cabeceras HTTP.

Vista integral de nóminas (Nominas.jsx) con estados controlados para la carga de datos, captura de excepciones del servidor y descarga segura de documentos en formato PDF.

Seguridad y Enrutamiento Protegido: Modificación global en App.jsx mediante contextos de React para encapsular las rutas de la aplicación de acuerdo al rol del usuario autenticado (ej. Administrador, Ayuntamiento, Empresa, Trabajador).

Parte 2: Backend (API REST)
El servidor de la aplicación se ha construido sobre un backend robusto de tipado fuerte diseñado para soportar múltiples transacciones concurrentes con persistencia relacional.

Tecnologías Utilizadas
.NET 10 (C#) (Framework backend multiplataforma de alto rendimiento).

Entity Framework Core (ORM oficial para el mapeo objeto-relacional).

PostgreSQL (Motor de base de datos relacional potente y de código abierto).

BCrypt.Net (Algoritmo de hashing seguro para la protección de credenciales).

Inicialización y Comandos del Ecosistema
Creación de la API Base:
dotnet new webapi --force
¿Por qué? Genera el andamiaje (scaffolding) oficial de una API REST de C#, configurando el archivo controlador .csproj y el punto de entrada de la aplicación en Program.cs. El modificador --force asegura la sobreescritura limpia de archivos huérfanos.

Instalación del Proveedor de Datos (PostgreSQL):
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
¿Por qué? Actúa como el intérprete nativo que traduce las consultas generadas por Entity Framework Core a sentencias SQL nativas que PostgreSQL puede computar de manera eficiente.

Herramientas de Diseño para Migraciones (Code-First):
dotnet add package Microsoft.EntityFrameworkCore.Design
¿Por qué? Instala las dependencias y herramientas en tiempo de diseño necesarias para habilitar el motor de migraciones locales de la base de datos a partir de clases puras de C#.

Configuraciones Críticas del Sistema
Buenas Prácticas de Configuración: Las credenciales de acceso de la base de datos se desacoplaron por completo del código fuente utilizando el proveedor de configuraciones externo en appsettings.json bajo el bloque ConnectionStrings.

Control de Origen Cruzado (CORS)
Se ha habilitado y configurado explícitamente la política de CORS en el middleware de Program.cs para enlazar de manera segura los orígenes de React en desarrollo, eliminando los bloqueos en las peticiones cruzadas HTTP (POST, GET, PUT, DELETE).

Entorno de Desarrollo y Base de Datos (Code-First)
Motor Local: Uso de Postgres.app en entornos macOS para un aislamiento completo del sistema operativo.

Credenciales locales: En entornos de desarrollo con Postgres.app, el servidor se ejecuta en localhost:5432, utilizando el nombre de usuario del sistema operativo y sin contraseña por defecto, lo que agiliza las pruebas locales.

Mapeo del Dominio (Models): Modelado relacional complejo en la carpeta /Models de la API, abstrayendo entidades clave como Ayuntamiento, Empresa, Personal, Lote, Pliego y gestionando la herencia nativa de tipos de datos de Usuario.

Inyección de Dependencias: Registro de la clase abstracta ApplicationDbContext en el contenedor IOC de Program.cs mediante la instrucción builder.Services.AddDbContext.

Despliegue de la Base de Datos Física y Resolución de Problemas
Durante el arranque inicial se comprobaron los puertos de escucha locales en localhost:5125. Para solventar los inconvenientes habituales de configuración en entornos macOS y compresión de arquitecturas, se aplicaron las siguientes soluciones:

Error "dotnet-ef command not found": Se instaló la herramienta de manera global y se vinculó la ruta de binarios ~/.dotnet/tools al $PATH del sistema de archivos del terminal de Mac.

Errores de compilación por Namespaces: Se unificaron los espacios de nombres del proyecto, forzando la importación explícita de "using VestaApi.Models;" dentro del contexto relacional.

Falta de referencias en Program.cs: Se depuró el archivo de inicio eliminando dependencias no instaladas de Swagger y se aseguró la coherencia de inyección de builder.Services.AddDbContext.

Finalmente, se ejecutaron con éxito los comandos de despliegue estructural:

Generación del Script de Migración:
dotnet ef migrations add MigracionInicial

Actualización Estructural en Postgres:
dotnet ef database update

Resultado: El motor de EF Core identificó la ausencia de la base de datos VestaDB, procediendo a su creación automática e inyección de llaves primarias, llaves foráneas (Foreign Keys), restricciones e índices optimizados junto al script de inicialización de datos de prueba (DbInitializer.cs).

 Requisitos de la Aplicación
Requisitos Funcionales (RF)
Gestión administrativa multi-rol: CRUD de ayuntamientos, centros/colegios, empresas y sindicatos.

Módulo de licitaciones: Organización de centros por lotes administrativos y sus correspondientes pliegos de condiciones.

Transparencia sindical: Acceso específico para representantes de los trabajadores donde podrán consultar el listado de personal, horas y notas de incidencias para asegurar el cumplimiento de los pliegos.

Control de personal: Registro detallado de encargados y empleados (nombre, móvil, notas, centro asignado y empresa actual).

Portal de empleo público: Un apartado abierto para que ciudadanos consulten qué empresa gestiona cada centro y puedan enviar su CV directamente a la empresa encargada.

Seguridad avanzada: Sistema de autenticación con diferentes niveles de visibilidad según el perfil (admin, empresa, sindicato, público).

Requisitos No Funcionales (RNF)
Seguridad y Privacidad (RGPD):

Estricto cumplimiento de la normativa de protección de datos en el almacenamiento y tratamiento de CVs de los ciudadanos.

Cifrado irreversible de credenciales en base de datos mediante el algoritmo de hashing seguro BCrypt.

Canales de comunicación blindados bajo el protocolo de red segura.

Trawzabilidad del sistema mediante el registro de los accesos críticos para auditorías (especialmente en transparencia y control de personal).

 Rendimiento y Disponibilidad:

Tiempos de respuesta del servidor e interacciones del frontend inferiores a 2 segundos por petición ordinaria o transacciones habituales.

Disponibilidad continua (24/7) del portal público garantizada con un acuerdo de nivel de servicio del 99,5%.

 Usabilidad y Accesibilidad:

Diseño 100% responsivo adaptable por igual a dispositivos móviles, tablets y ordenadores de escritorio.

Directrices de accesibilidad web conformes a los estándares WCAG 2.1 (Nivel AA) para asegurar el acceso ciudadano.

 Escalabilidad y Mantenibilidad:

Arquitectura orientada a servicios desacoplados que permite la adhesión ilimitada de nuevos Ayuntamientos, centros o lotes sin penalizar el rendimiento del núcleo del sistema.

Modularidad avanzada para facilitar las futuras actualizaciones del software de manera aislada.