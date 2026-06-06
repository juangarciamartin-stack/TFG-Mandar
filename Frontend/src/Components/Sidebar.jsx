import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Leemos directamente para reaccionar a los cambios de estado del ciclo de baja
  const miRol = localStorage.getItem("rol") || "Trabajador";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="vesta-sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">V</div>
        <h2>VESTA</h2>
      </div>

      <nav className="sidebar-links">
        {/* Inicio */}
        <Link to="/dashboard" className={`nav-link ${isActive("/dashboard")}`}>
          <span>Inicio</span>
        </Link>

        {/*Ayuntamientos */}
        {miRol === "Admin" && (
          <Link
            to="/ayuntamientos"
            className={`nav-link ${isActive("/ayuntamientos")}`}
          >
            <span>Ayuntamientos</span>
          </Link>
        )}

        {/* Catálogo de Empresas */}
        {(miRol === "Admin" ||
          miRol === "Ayuntamiento" ||
          miRol === "Empresa" ||
          miRol === "Trabajador") && (
          <Link to="/empresas" className={`nav-link ${isActive("/empresas")}`}>
            <span>Empresas</span>
          </Link>
        )}

        {/* Panel de Validación de Solicitudes */}
        {(miRol === "Admin" || miRol === "Ayuntamiento") && (
          <Link
            to="/empresas-pendientes"
            className={`nav-link ${isActive("/empresas-pendientes")}`}
          >
            <span>Validar Empresas</span>
          </Link>
        )}

        {/*Solicitar mi Empresa */}
        {(miRol === "Trabajador" || miRol === "Empresa") && (
          <Link
            to="/solicitar-empresa"
            className={`nav-link ${isActive("/solicitar-empresa")}`}
          >
            <span>Solicitar mi Empresa</span>
          </Link>
        )}

        {(miRol === "Admin" || miRol === "Ayuntamiento") && (
          <>
            <Link to="/lotes" className={`nav-link ${isActive("/lotes")}`}>
              <span>Lotes y Pliegos</span>
            </Link>
            <Link to="/centros" className={`nav-link ${isActive("/centros")}`}>
              <span>Centros/Colegios</span>
            </Link>
          </>
        )}

        {/* Incidencias */}
        {miRol !== "Ayuntamiento" && (
          <Link
            to="/incidencias"
            className={`nav-link ${isActive("/incidencias")}`}
          >
            <span>Incidencias</span>
          </Link>
        )}

        {/*  Gestión de la plantilla (Ocultado automáticamente si dejas de ser Empresa) */}
        {(miRol === "Admin" || miRol === "Empresa") && (
          <Link to="/personal" className={`nav-link ${isActive("/personal")}`}>
            <span>Gestión de Personal</span>
          </Link>
        )}

        {/* Módulo unificado de Nóminas */}
        {(miRol === "Admin" ||
          miRol === "Trabajador" ||
          miRol === "Empresa") && (
          <Link to="/nominas" className={`nav-link ${isActive("/nominas")}`}>
            <span>
              {miRol === "Empresa" ? "Gestión de Nóminas" : "Mis Nóminas"}
            </span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer-info">
        <p>VESTA Dashboard v1.0</p>
        <p>© 2026 Todos los derechos reservados</p>
        <button onClick={handleLogout} className="btn-sidebar-logout">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
