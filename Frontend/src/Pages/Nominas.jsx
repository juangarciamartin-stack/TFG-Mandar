import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import api from "../services/api"; 

export const Nominas = () => {
  const miRol = localStorage.getItem("rol") || "Trabajador";
  const miUsuarioId = localStorage.getItem("usuarioId");

  const [pestañaActiva, setPestañaActiva] = useState("empleados");
  const [misNominas, setMisNominas] = useState([]);
  const [nominasPlantilla, setNominasPlantilla] = useState([]);

  const [misEmpresas, setMisEmpresas] = useState([]);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState("");

  const esAdminOAyuntamiento = miRol === "Admin" || miRol === "Ayuntamiento";
  const tienePrivilegiosPlantilla = esAdminOAyuntamiento || miRol === "Empresa";

useEffect(() => {
  const cargarEmpresasSelector = async () => {
    if (!miUsuarioId) return;
    try {
      let res;
      
      if (esAdminOAyuntamiento) {
        res = await api.get("/Empresas"); 
      } else if (miRol === "Empresa") {
        res = await api.get(`/Empresas/mis-empresas-gestor/${miUsuarioId}`);
      } else {
        return;
      }

      let empresasNormalizadas = [];
      
      if (res.data && Array.isArray(res.data)) {
        empresasNormalizadas = res.data.map(emp => ({
          id: emp.id ?? emp.Id ?? emp.idEmpresa ?? emp.IdEmpresa,
          nombreEmpresa: emp.nombreEmpresa ?? emp.NombreEmpresa ?? emp.nombre ?? emp.Nombre
        }));
      }

      setMisEmpresas(empresasNormalizadas);
      
      if (empresasNormalizadas.length > 0) {
        setEmpresaSeleccionadaId(empresasNormalizadas[0].id);
      }
    } catch (error) {
      console.error("Error al recuperar las empresas para el selector en Nóminas:", error);
    }
  };
  
  cargarEmpresasSelector();
}, [miUsuarioId, miRol, esAdminOAyuntamiento]);

  useEffect(() => {
    const cargarDatosSeguros = async () => {
      try {
        if (esAdminOAyuntamiento) {
          const resGlobal = await api.get("/Nominas");

          if (empresaSeleccionadaId) {
            const filtradas = resGlobal.data.filter(
              (n) => (n.empresaId || n.EmpresaId)?.toString() === empresaSeleccionadaId.toString()
            );
            setNominasPlantilla(filtradas);
          } else {
              setNominasPlantilla(resGlobal.data);
            }
        }

        if (miRol === "Empresa") {
          const resEmpresa = await api.get("/Nominas/historial-empresario");

          if (empresaSeleccionadaId) {
            const filtradas = resEmpresa.data.filter(
              (n) =>
                (n.empresaId || n.EmpresaId) ===
                parseInt(empresaSeleccionadaId),
            );
            setNominasPlantilla(filtradas);
          } else {
            setNominasPlantilla(resEmpresa.data);
          }
        }

        if (
          miRol === "Trabajador" ||
          (miRol === "Empresa" && pestañaActiva === "mis-nominas")
        ) {
          const resPropias = await api.get("/Nominas/mis-nominas");
          setMisNominas(resPropias.data);
        }
      } catch (error) {
        console.error(
          "Error al recuperar las nóminas desde el servidor:",
          error,
        );
      }
    };

    cargarDatosSeguros();
  }, [miRol, pestañaActiva, empresaSeleccionadaId]);

 const descargarOVerPdf = async (idNomina) => {
    if (!idNomina) {
      alert("ID de registro no válido.");
      return;
    }

    try {

      const respuesta = await api.get(`/Nominas/descargar/${idNomina}`, {
        responseType: 'blob' 
      });

      const blob = new Blob([respuesta.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);

      window.open(urlBlob, '_blank');

      setTimeout(() => window.URL.revokeObjectURL(urlBlob), 100);

    } catch (error) {
      console.error("Error al intentar descargar el PDF de la nómina:", error);
      alert("No se pudo descargar o abrir el archivo PDF. Verifica los permisos o el estado del servidor.");
    }
  };
  return (
    <div className="vista-page-container">
      <Sidebar />
      <div className="vista-contenido-scroll">
        <div
          className="view-intro"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h1>Módulo de Liquidaciones y Nóminas</h1>
            <p>
              {tienePrivilegiosPlantilla
                ? "Consulta centralizada de recibos de salarios emitidos y archivo histórico municipal."
                : "Consulta, firma electrónica y descarga de tus recibos de salarios devengados."}
            </p>
          </div>

            {tienePrivilegiosPlantilla && (!esAdminOAyuntamiento ? pestañaActiva === "empleados" : true) && (misEmpresas.length > 0 || esAdminOAyuntamiento) && (
              <div style={styles.selectorContainer}>
                <label style={styles.selectorLabel}>
                  {esAdminOAyuntamiento
                    ? "Supervisar Lote / Empresa:"
                    : "Filtrar Plantilla de:"}
                </label>
               <select
                  value={empresaSeleccionadaId}
                  onChange={(e) => setEmpresaSeleccionadaId(e.target.value)}
                  style={styles.selectDropdown}
                >
                  {esAdminOAyuntamiento && (
                    <option value="">-- Ver Todas --</option>
                  )}
                  
                  {misEmpresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombreEmpresa}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>

        {miRol === "Empresa" && (
          <div style={styles.tabsContainer}>
            <button
              onClick={() => setPestañaActiva("empleados")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  pestañaActiva === "empleados" ? "#2563eb" : "#e2e8f0",
                color: pestañaActiva === "empleados" ? "#fff" : "#475569",
              }}
            >
              Nóminas de mi Plantilla
            </button>
            <button
              onClick={() => setPestañaActiva("mis-nominas")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  pestañaActiva === "mis-nominas" ? "#2563eb" : "#e2e8f0",
                color: pestañaActiva === "mis-nominas" ? "#fff" : "#475569",
              }}
            >
              Mi Historial Personal
            </button>
          </div>
        )}

        {(esAdminOAyuntamiento ||
          (miRol === "Empresa" && pestañaActiva === "empleados")) && (
          <div className="modulo-tarjeta-blanca">
            <h3
              style={{
                margin: "0 0 15px 0",
                color: "#0f172a",
                fontSize: "16px",
              }}
            >
              {esAdminOAyuntamiento
                ? "Registro Auditor de Recibos Salariales"
                : "Histórico de Nóminas Subidas"}
            </h3>
            {nominasPlantilla.length === 0 ? (
              <p style={styles.sinDatos}>
                No se han localizado recibos digitales para los criterios de
                búsqueda.
              </p>
            ) : (
              <table className="tabla-vesta">
                <thead>
                  <tr>
                    <th>Empleado</th>
                    <th>Empresa Adjudicataria</th>
                    <th>Periodo</th>
                    <th style={{ textAlign: "right" }}>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {nominasPlantilla.map((n) => (
                    <tr key={n.id || n.Id}>
                      <td>
                        <strong>{n.nombreEmpleado || n.NombreEmpleado}</strong>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {n.emailEmpleado}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#475569",
                          }}
                        >
                          {n.nombreEmpresa || n.NombreEmpresa}
                        </span>
                      </td>
                      <td>
                        <strong>{n.mes}</strong> / {n.anio}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-vesta secundario"
                          onClick={() => descargarOVerPdf(n.id || n.Id, n.rutaArchivoPDF || n.RutaArchivoPDF)}
                        >
                          Ver PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {(miRol === "Trabajador" ||
          (miRol === "Empresa" && pestañaActiva === "mis-nominas")) && (
          <div className="modulo-tarjeta-blanca">
            <h3
              style={{
                margin: "0 0 15px 0",
                color: "#0f172a",
                fontSize: "16px",
              }}
            >
              Tus Recibos de Salario de Operario
            </h3>
            {misNominas.length === 0 ? (
              <p style={styles.sinDatos}>
                No posees recibos de salario registrados a tu nombre.
              </p>
            ) : (
              <table className="tabla-vesta">
                <thead>
                  <tr>
                    <th>Empresa Emisora</th>
                    <th>Periodo</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {misNominas.map((mn) => (
                    <tr key={mn.id || mn.Id}>
                      <td>
                        {mn.empresa?.nombreEmpresa ||
                          mn.NombreEmpresa ||
                          "Contrata Asignada"}
                      </td>
                      <td>
                        <strong>
                          {mn.mes} / {mn.anio}
                        </strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-vesta primario"
                          style={{ padding: "5px 12px", fontSize: "12px" }}
                          onClick={() =>
                            descargarOVerPdf(
                              mn.id || mn.Id,
                              mn.rutaArchivoPDF || mn.RutaArchivoPDF,
                            )
                          }
                        >
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  selectorContainer: {
    backgroundColor: "#f1f5f9",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  selectorLabel: { fontSize: "12px", fontWeight: "700", color: "#475569" },
  selectDropdown: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#fff",
    cursor: "pointer",
    outline: "none",
  },
  tabsContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "10px",
  },
  tabBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#e2e8f0",
    color: "#334155",
  },
  sinDatos: {
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    padding: "20px 0",
    margin: 0,
    fontStyle: "italic",
  },
};
