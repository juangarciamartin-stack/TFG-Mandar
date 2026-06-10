import React, { useState, useEffect } from "react";
import Sidebar from "../Components/Sidebar";
import api from "../services/api"; 

export const Personal = () => {
  const miRol = localStorage.getItem("rol") || "Trabajador";
  const miUsuarioId = localStorage.getItem("usuarioId");

  const [misEmpresas, setMisEmpresas] = useState([]);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState("");

  const [trabajadoresActivos, setTrabajadoresActivos] = useState([]);
  const [postulantesBolsa, setPostulantesBolsa] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [formNomina, setFormNomina] = useState({ archivo: null });
  const [recargarTrigger, setRecargarTrigger] = useState(0);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const fechaActual = new Date();
  const mesActualTexto = meses[fechaActual.getMonth()];
  const anioActual = fechaActual.getFullYear();

useEffect(() => {
  const cargarEmpresasSelector = async () => {
    if (!miUsuarioId) return;
    try {
      let res;
      
      // 1. Hacemos las peticiones correctas por rol
      if (miRol === "Admin" || miRol === "Ayuntamiento") {
        res = await api.get("/Empresas"); 
      } else if (miRol === "Empresa") {
        res = await api.get(`/Empresas/mis-empresas-gestor/${miUsuarioId}`);
      } else {
        return;
      }

      console.log("Datos brutos recibidos en Personal para el rol " + miRol + ":", res.data);

      let empresasFiltradas = [];
      
      if (res.data && Array.isArray(res.data)) {
        // 2. UNIFICAMOS el formato de los objetos para evitar errores de mapeo entre endpoints
        const empresasNormalizadas = res.data.map(emp => ({
          id: emp.id ?? emp.Id ?? emp.idEmpresa ?? emp.IdEmpresa,
          nombreEmpresa: emp.nombreEmpresa ?? emp.NombreEmpresa ?? emp.nombre ?? emp.Nombre,
          estado: emp.estado ?? emp.Estado ?? "",
          estadoAprobacion: emp.estadoAprobacion ?? emp.EstadoAprobacion ?? ""
        }));

        // 3. FILTRAMOS de manera segura: Solo pasan las que NO estén de baja
        empresasFiltradas = empresasNormalizadas.filter((emp) => {
          const estInterno = emp.estado.toLowerCase().trim();
          const estAprob = emp.estadoAprobacion.toLowerCase().trim();
          
          return estInterno !== "baja" && estAprob !== "baja" && estInterno !== "solicitada baja";
        });
      }

      console.log("Empresas finales listas para el selector (Personal):", empresasFiltradas);

      // 4. Guardamos en el estado
      setMisEmpresas(empresasFiltradas);
      
      // 5. Auto-seleccionamos la primera si hay resultados
      if (empresasFiltradas.length > 0) {
        setEmpresaSeleccionadaId(empresasFiltradas[0].id);
      } else {
        setEmpresaSeleccionadaId(""); // Limpiamos si viene vacío
      }
    } catch (error) {
      console.error("Error al recuperar las empresas para el selector en Personal:", error);
    }
  };
  
  cargarEmpresasSelector();
}, [miUsuarioId, miRol]);

  useEffect(() => {
    const cargarTodoElPersonal = async () => {
      if (!empresaSeleccionadaId) {
        setPostulantesBolsa([]);
        setTrabajadoresActivos([]);
        return;
      }

      try {
        const resBolsa = await api.get(
          `/Empresas/mis-candidatos/${empresaSeleccionadaId}`,
        );
        setPostulantesBolsa(resBolsa.data);

        const resPlantilla = await api.get(
          `/Empresas/mi-plantilla/${empresaSeleccionadaId}`,
        );
        setTrabajadoresActivos(resPlantilla.data);
      } catch (error) {
        console.error(
          "Error al sincronizar el personal desde el servidor:",
          error,
        );
      }
    };

    cargarTodoElPersonal();
  }, [empresaSeleccionadaId, recargarTrigger]);

  const abrirModalNomina = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setFormNomina({ archivo: null });
    setMostrarModal(true);
  };

 const handleSubirNominaSimplificada = async (e) => {
    e.preventDefault();
    if (!formNomina.archivo || !empleadoSeleccionado) {
      alert("Por favor, selecciona primero un archivo en formato PDF.");
      return;
    }

    // 1. Extraemos correctamente el ID del operario
    const idUsuario =
      empleadoSeleccionado.id ||
      empleadoSeleccionado.Id ||
      empleadoSeleccionado.usuarioId ||
      empleadoSeleccionado.UsuarioId;

    const formData = new FormData();
    
    // 2. Mapeamos los campos exactamente como los pide tu [FromForm] de C#
    formData.append("usuarioId", idUsuario);
    formData.append("empresaId", empresaSeleccionadaId); // ¡Imprescindible!
    
    // 3. Formateamos el periodo con '/' para que pase el .Contains("/") del backend
    formData.append("periodo", `${mesActualTexto} / ${anioActual}`);
    
    // 4. El nombre de la clave debe ser exactamente "archivoNomina" como tu IFormFile
    formData.append("archivoNomina", formNomina.archivo); 

    try {
      // Realizamos la petición POST al backend
      const res = await api.post("/Empresas/subir-nomina", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Si tu backend responde con Ok, sacamos el mensaje que configuraste en C#
      alert(res.data?.mensaje || `¡Nómina emitida con éxito para el periodo de ${mesActualTexto}!`);
      
      setMostrarModal(false);
      setFormNomina({ archivo: null });
    } catch (error) {
      console.error("Error al transferir la nómina al backend:", error);
      
      // Capturamos el string directo que devuelve tu BadRequest("...") o el JSON de error
      const mensajeError = typeof error.response?.data === "string" 
        ? error.response.data 
        : (error.response?.data?.mensaje || "Error crítico al guardar la nómina.");
        
      alert(mensajeError);
    }
  };

  const handleContratar = async (candidatoId, nombre) => {
    if (!empresaSeleccionadaId) return;

    if (window.confirm(`¿Confirmas la contratación definitiva de ${nombre}?`)) {
      try {
        await api.put(`/Empresas/${empresaSeleccionadaId}/aceptar-trabajador`, {
          UsuarioId: candidatoId,
        });

        alert(
          `¡Alta tramitada! ${nombre} ya figura en la plantilla oficial de la adjudicataria.`,
        );
        setRecargarTrigger((prev) => prev + 1);
      } catch {
        alert("Ocurrió un error al procesar el alta contractual.");
      }
    }
  };

  const handleDespedir = async (trabajadorId, nombre) => {
    if (!empresaSeleccionadaId) return;

    const confirmar = window.confirm(
      `¿Estás seguro de que deseas rescindir el contrato de "${nombre}"?\n\nEl operario dejará de pertenecer a la plantilla activa.`,
    );

    if (confirmar) {
      try {
        await api.delete(
          `/Empresas/${empresaSeleccionadaId}/despedir-trabajador/${trabajadorId}`,
        );
        alert(
          `Contrato rescindido. Se ha tramitado la baja de ${nombre} con éxito.`,
        );
        setRecargarTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error al tramitar la baja del operario:", error);
        alert("No se pudo tramitar la baja del operario en el servidor.");
      }
    }
  };

const verDocumentoPDF = (url) => {
  if (!url) {
    alert("Esta nómina no tiene ningún documento PDF asociado.");
    return;
  }

  // Si la url ya viene completa con http, la abrimos directamente
  if (url.startsWith("http")) {
    window.open(url, "_blank");
    return;
  }

  // 1. Intentamos obtener la URL base limpia directamente de la ventana del navegador
  // Si tu frontend corre en http://localhost:3000, esto detectará "http://localhost:"
  const puertoBackend = "5125"; // El puerto de tu API .NET
  let baseUrl = `${window.location.protocol}//${window.location.hostname}:${puertoBackend}/`;

  // 2. Por si acaso estás usando otra IP o producción, probamos con api.defaults.baseURL
  if (api.defaults.baseURL) {
    try {
      // Usamos el constructor de URL nativo de JavaScript para extraer solo el HOST (ej: http://localhost:5125)
      // Esto elimina '/api', '/api/' y cualquier ruta extra limpiamente.
      const urlObj = new URL(api.defaults.baseURL);
      baseUrl = `${urlObj.protocol}//${urlObj.host}/`;
    } catch (e) {
      console.error("Error parseando api.defaults.baseURL:", e);
    }
  }

  // 3. Limpiamos la ruta del archivo (quitamos la barra inicial si existe)
  let rutaLimpia = url;
  if (rutaLimpia.startsWith("/")) {
    rutaLimpia = rutaLimpia.substring(1);
  }

  const urlFinal = `${baseUrl}${rutaLimpia}`;
  console.log("🚀 URL FINAL GENERADA PARA EL PDF:", urlFinal);

  // Abrimos en pestaña nueva
  window.open(urlFinal, "_blank");
};

  const tienePrivilegiosEdicion =
    miRol === "Empresa" || miRol === "Admin" || miRol === "Ayuntamiento";

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
            <h1>Gestión de Personal y Plantilla</h1>
            <p>
              {miRol === "Admin" || miRol === "Ayuntamiento"
                ? "Panel Supervisor: Monitorización y edición de plantillas de todas las empresas homologadas."
                : "Supervisión de operarios asignados a tus lotes activos, tramitación de altas de bolsa y emisión de nóminas."}
            </p>
          </div>

            {tienePrivilegiosEdicion && (misEmpresas.length > 0 || miRol === "Admin" || miRol === "Empresa") && (
            <div style={styles.selectorContainer}>
              <label style={styles.selectorLabel}>
                {miRol === "Admin" || miRol === "Ayuntamiento"
                  ? "Supervisando Empresa:"
                  : "Gestionando Empresa:"}
              </label>
              <select
                value={empresaSeleccionadaId}
                onChange={(e) => setEmpresaSeleccionadaId(e.target.value)}
                style={styles.selectDropdown}
              >
                {/* Si eres Admin o Ayuntamiento, damos la opción de ver todas */}
                {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                  <option value="">-- Ver Todas --</option>
                )}
                
                {/* Recorremos el array que ya viene normalizado y limpio de bajas */}
                {misEmpresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombreEmpresa}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modulo-tarjeta-blanca" style={{ marginBottom: "30px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>
            Operarios Contratados en la Empresa
          </h3>
          {trabajadoresActivos.length === 0 ? (
            <p style={styles.sinDatos}>
              No hay trabajadores dados de alta en esta plantilla actualmente.
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Puesto / Relación Laboral</th>
                  {tienePrivilegiosEdicion && (
                    <th style={{ textAlign: "right" }}>Operaciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {trabajadoresActivos.map((t) => {
                  const idFila = t.usuarioId || t.UsuarioId || t.id || t.Id;
                  const nombreFila =
                    t.nombre || t.Nombre || "Operario Desconocido";
                  return (
                    <tr key={idFila}>
                      <td>
                        <strong>{nombreFila}</strong>
                      </td>
                      <td>{t.email || t.Email}</td>
                      <td>
                        <span style={{ color: "#10b981", fontWeight: "600" }}>
                          {t.relacionLaboral ||
                            t.RelacionLaboral ||
                            "Operario de Lote"}
                        </span>
                      </td>
                      {tienePrivilegiosEdicion && (
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              className="btn-vesta primario"
                              style={{ padding: "6px 12px", fontSize: "13px" }}
                              onClick={() => abrirModalNomina(t)}
                            >
                              Subir Nómina
                            </button>
                            <button
                              className="btn-vesta peligro"
                              style={{
                                padding: "6px 12px",
                                fontSize: "13px",
                                backgroundColor: "#ef4444",
                                color: "#fff",
                                border: "none",
                              }}
                              onClick={() => handleDespedir(idFila, nombreFila)}
                            >
                              Tramitar Baja
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="modulo-tarjeta-blanca">
          <h3 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>
            Currículums en Bolsa (Pendientes de Evaluación)
          </h3>
          {postulantesBolsa.length === 0 ? (
            <p style={styles.sinDatos}>
              La bolsa de trabajo para esta empresa está vacía.
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Email</th>
                  <th>Notas de Referencia</th>
                  <th>Documento CV</th>
                  {tienePrivilegiosEdicion && (
                    <th style={{ textAlign: "right" }}>Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {postulantesBolsa.map((pb) => {
                  const idCandidato =
                    pb.usuarioId || pb.UsuarioId || pb.id || pb.Id;
                  const nombreCandidato = pb.nombre || pb.Nombre;
                  return (
                    <tr key={idCandidato}>
                      <td>
                        <strong>{nombreCandidato}</strong>
                      </td>
                      <td>{pb.email || pb.Email}</td>
                      <td style={{ fontStyle: "italic", color: "#64748b" }}>
                        "{pb.notas || pb.Notas || "Sin observaciones"}"
                      </td>
                      <td>
                      <button
                        className="btn-vesta secundario"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                        onClick={() => verDocumentoPDF(pb.curriculumUrl || pb.CurriculumUrl || pb.curriculumURl)}
                      >
                        Ver CV
                      </button>
                      </td>
                      {tienePrivilegiosEdicion && (
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn-vesta profesional"
                            style={{
                              backgroundColor: "#10b981",
                              color: "white",
                              padding: "6px 12px",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              handleContratar(idCandidato, nombreCandidato)
                            }
                          >
                            Aceptar y Contratar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {mostrarModal && empleadoSeleccionado && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3
                style={{
                  marginTop: 0,
                  color: "#0f172a",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "10px",
                }}
              >
                Vincular Recibo Salarial
              </h3>
              <div style={styles.infoBox}>
                <p style={{ margin: "4px 0" }}>
                  Trabajador:{" "}
                  <strong>
                    {empleadoSeleccionado.nombre || empleadoSeleccionado.Nombre}
                  </strong>
                </p>
                <p
                  style={{
                    margin: "4px 0",
                    color: "#2563eb",
                    fontWeight: "600",
                  }}
                >
                  Periodo de registro: {mesActualTexto} / {anioActual}
                </p>
              </div>
              <form
                onSubmit={handleSubirNominaSimplificada}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label style={styles.label}>
                    Adjuntar Documento Oficial (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    style={styles.input}
                    onChange={(e) =>
                      setFormNomina({ archivo: e.target.files[0] })
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "5px",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      ...styles.btnModal,
                      backgroundColor: "#cbd5e1",
                      color: "#334155",
                    }}
                    onClick={() => setMostrarModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      ...styles.btnModal,
                      backgroundColor: "#2563eb",
                      color: "white",
                    }}
                  >
                    Emitir y Registrar
                  </button>
                </div>
              </form>
            </div>
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    color: "#475569",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#334155",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  btnModal: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  sinDatos: {
    color: "#64748b",
    fontSize: "14px",
    textAlign: "center",
    padding: "30px 0",
    margin: 0,
    fontStyle: "italic",
  },
};