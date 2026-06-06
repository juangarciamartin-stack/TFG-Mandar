import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import "./Dashboard.css";
import {
  FaBuilding,
  FaUsers,
  FaExclamationTriangle,
  FaUniversity,
  FaRegCheckCircle,
  FaScroll,
  FaSchool,
  FaFileInvoiceDollar,
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const miRol = localStorage.getItem("rol") || "Trabajador";

  const todosLosModulos = [
    {
      id: "ayuntamientos",
      titulo: "Ayuntamientos",
      desc: "Gestiona las entidades municipales y sus contratos.",
      icono: <FaUniversity size={32} color="#1a365d" />,
      ruta: "/ayuntamientos",
      rolesPermitidos: ["Admin"],
    },
    {
      id: "empresas",
      titulo: "Empresas",
      desc: "Registra y administra las empresas contratistas.",
      icono: <FaBuilding size={32} color="#2b6cb0" />,
      ruta: "/empresas",
      rolesPermitidos: ["Admin", "Ayuntamiento", "Empresa", "Trabajador"],
    },
    {
      id: "validar",
      titulo: "Validar Empresas",
      desc: "Panel de aprobación de solicitudes de empresas pendientes.",
      icono: <FaRegCheckCircle size={32} color="#38a169" />,
      ruta: "/empresas-pendientes",
      rolesPermitidos: ["Admin", "Ayuntamiento"],
    },
    {
      id: "lotes",
      titulo: "Lotes y Pliegos",
      desc: "Documentación contractual centralizada y accesible.",
      icono: <FaScroll size={32} color="#d69e2e" />,
      ruta: "/lotes",
      rolesPermitidos: ["Admin", "Ayuntamiento"],
    },
    {
      id: "centros",
      titulo: "Centros / Colegios",
      desc: "Mapa completo de ubicaciones y centros asignados.",
      icono: <FaSchool size={32} color="#4a5568" />,
      ruta: "/centros",
      rolesPermitidos: ["Admin", "Ayuntamiento"],
    },
    {
      id: "incidencias",
      titulo: "Incidencias",
      desc: "Buzón de incidencias operativas e infraestructura.",
      icono: <FaExclamationTriangle size={32} color="#e53e3e" />,
      ruta: "/incidencias",
      rolesPermitidos: ["Admin", "Empresa", "Trabajador"],
    },
    {
      id: "personal",
      titulo: "Gestión de Personal",
      desc: "Fichas de empleados, plantillas y documentación laboral.",
      icono: <FaUsers size={32} color="#319795" />,
      ruta: "/personal",
      rolesPermitidos: ["Admin", "Empresa"],
    },
    {
      id: "nominas",
      titulo: "Mis Nóminas",
      desc: "Visualización de nóminas y archivos asignados.",
      icono: <FaFileInvoiceDollar size={32} color="#dd6b20" />,
      ruta: "/nominas",
      rolesPermitidos: ["Admin", "Trabajador", "Empresa"],
    },
  ];

  const modulosVisibles = todosLosModulos.filter((modulo) =>
    modulo.rolesPermitidos.includes(miRol),
  );

  return (
    <div className="dashboard-wrapper">
      <Sidebar />

      <div className="main-viewport">
        <div className="dashboard-centered-block">
          <div className="view-intro">
            <h1>
              Bienvenido a <span style={{ color: "#2563eb" }}>VESTA</span>
            </h1>
            <p>
              Todo lo que necesitas para gestionar personal, contratos y centros
              en un único lugar. Selecciona un módulo del menú lateral o desde
              aquí para comenzar.
            </p>
          </div>

          <div
            className="modules-section-title"
            style={{ marginTop: "40px", marginBottom: "20px" }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#94a3b8",
                letterSpacing: "1px",
                fontWeight: "700",
              }}
            >
              MÓDULOS DISPONIBLES
            </h3>
          </div>

          <div className="metrics-grid">
            {modulosVisibles.map((modulo) => (
              <div
                key={modulo.id}
                className="metric-card"
                onClick={() => navigate(modulo.ruta)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    width: "100%",
                  }}
                >
                  <div
                    className="metric-icon-box blue-bg"
                    style={{ fontSize: "20px", flexShrink: 0 }}
                  >
                    {modulo.icono}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h4
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "15px",
                        color: "#0f172a",
                        fontWeight: "600",
                      }}
                    >
                      {modulo.titulo}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#64748b",
                        lineHeight: "1.4",
                      }}
                    >
                      {modulo.desc}
                    </p>
                  </div>
                  <div
                    style={{
                      color: "#cbd5e1",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
