import React, { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "../Components/Sidebar";
import api from "../services/api";
import {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  postularseAEmpresa,
} from "../services/empresaService";
import { getMisContratasTrabajador } from "../services/incidenciaService";

export const Empresas = () => {
  const miRol = localStorage.getItem("rol") || "Trabajador";
  const miUsuarioId = parseInt(localStorage.getItem("usuarioId"), 10) || 0;

  // Referencia para limpiar el input de tipo file correctamente
  const fileInputRef = useRef(null);

  // --- ESTADOS ---
  const [todasLasEmpresas, setTodasLasEmpresas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [idEmpresaContratado, setIdEmpresaContratado] = useState([]);

  // Inicialización inteligente por Rol
  const [vistaActiva, setVistaActiva] = useState(() => {
    if (miRol === "Admin" || miRol === "Ayuntamiento") return "activas";
    if (miRol === "Trabajador") return "todas"; 
    return "propias";
  });

  const [mostrarModalCV, setMostrarModalCV] = useState(false);
  const [empresaPostularSeleccionada, setEmpresaPostularSeleccionada] = useState(null);
  const [formCV, setFormCV] = useState({ archivo: null, notas: "" });

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    cif: "",
    direccion: "",
    emailContacto: "",
    usuarioId: "",
  });

  // --- DERIVADOS ---
  const tieneEmpresaActiva = todasLasEmpresas.some(
    (e) => e.usuarioId === miUsuarioId && e.estadoAprobacion === "Aprobado",
  );

  const tieneContratosActivos = todasLasEmpresas.some(
    (e) => idEmpresaContratado.includes(e.id) && e.estadoAprobacion === "Aprobado",
  );

  // --- MÉTODOS DE CARGA ---
  const cargarUsuarios = useCallback(async () => {
    if (miRol !== "Admin") return;
    try {
      const response = await api.get("/Usuarios/lista-simples");
      const listaCompleta = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      const soloPersonasYEmpresas = listaCompleta.filter((u) => {
        const rolUsuario = (u.Rol || u.rol || "").toLowerCase();
        return rolUsuario !== "admin" && rolUsuario !== "ayuntamiento";
      });

      setUsuariosDisponibles(soloPersonasYEmpresas);
    } catch (err) {
      console.error("Error al cargar usuarios filtrados:", err);
    }
  }, [miRol]);

  // --- MÉTODOS DE CARGA MODIFICADO ---
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);

      // 1. CAPTURAR EL ID SI EL ROL ES AYUNTAMIENTO
      // Si es Ayuntamiento, le pasamos su ID para que el backend filtre. 
      // Si es Admin, Empresa o Trabajador, pasamos null para que el backend devuelva TODO.
      const miAyuntamientoId = miRol === "Ayuntamiento" 
        ? parseInt(localStorage.getItem("idAyuntamiento"), 10) || null 
        : null;

      // 2. PASAMOS EL ID A LA FUNCIÓN DEL SERVICIO
      const data = await getEmpresas(miAyuntamientoId);
      const listaEmpresas = Array.isArray(data) ? data : data?.data || [];

      // RESOLUCIÓN PARALELA CORREGIDA: Sin llamadas fantasma
      const empresasConDetalles = await Promise.all(
        listaEmpresas.map(async (empresa) => {
          try {
            const [resCentros, resPliegos] = await Promise.all([
              api.get(`/Empresas/mis-centros/${empresa.id}`).catch(() => ({ data: [] })),
              api.get(`/Empresas/mis-pliegos/${empresa.id}`).catch(() => ({ data: [] })),
            ]);
            
            return {
              ...empresa,
              centrosCargados: resCentros.data || [],
              pliegosCargados: resPliegos.data || []
            };
          } catch (err) {
            console.error(`Error inyectando datos secundarios a empresa ${empresa.id}:`, err);
            return { ...empresa, centrosCargados: [], pliegosCargados: [] };
          }
        })
      );

      setTodasLasEmpresas(empresasConDetalles);
      
      if (miRol === "Trabajador") {
        try {
          const contratas = await getMisContratasTrabajador();
          if (contratas && contratas.length > 0) {
            const todosLosIdsActivos = contratas.map(
              (c) => c.empresaId || c.EmpresaId || c.id || c.Id,
            );
            setIdEmpresaContratado(todosLosIdsActivos);
            setVistaActiva("trabajando");
          } else {
            setIdEmpresaContratado([]);
          }
        } catch (err) {
          console.error("Error al obtener vinculaciones laborales", err);
        }
      } else {
        setIdEmpresaContratado([]);
      }
    } catch (error) {
      console.error("Error al cargar el catálogo comercial:", error);
    } finally {
      setLoading(false);
    }
  }, [miRol]);

  useEffect(() => {
    cargarDatos();
    cargarUsuarios();
  }, [cargarDatos, cargarUsuarios]);

  // --- FILTRADO EN MEMORIA ---
  useEffect(() => {
    if (miRol === "Admin" || miRol === "Ayuntamiento") {
      if (vistaActiva === "activas") {
        setEmpresasFiltradas(
          todasLasEmpresas.filter((e) => e.estadoAprobacion === "Aprobado" || !e.estadoAprobacion)
        );
      } else if (vistaActiva === "ceses") {
        setEmpresasFiltradas(
          todasLasEmpresas.filter((e) => e.estado === "Solicitada Baja" || e.estadoAprobacion === "Baja")
        );
      }
    } else {
      if (vistaActiva === "propias") {
        setEmpresasFiltradas(todasLasEmpresas.filter((e) => e.usuarioId === miUsuarioId));
      } else if (vistaActiva === "trabajando") {
        setEmpresasFiltradas(
          todasLasEmpresas.filter((e) => idEmpresaContratado.includes(e.id) && e.estadoAprobacion === "Aprobado")
        );
      } else {
        setEmpresasFiltradas(
          todasLasEmpresas.filter((e) => e.usuarioId !== miUsuarioId && e.estadoAprobacion !== "Baja" && !idEmpresaContratado.includes(e.id))
        );
      }
    }
  }, [vistaActiva, todasLasEmpresas, idEmpresaContratado, miRol, miUsuarioId]);

  // --- CONTROLADORES DE INTERFAZ ---
  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({ nombreEmpresa: "", cif: "", direccion: "", emailContacto: "", usuarioId: "" });
    setMostrarModal(true);
  };

  const prepararEdicion = (emp) => {
    setEditandoId(emp.id);
    setFormData({
      nombreEmpresa: emp.nombreEmpresa,
      cif: emp.cif,
      direccion: emp.direccion || "",
      emailContacto: emp.emailContacto,
      usuarioId: emp.usuarioId ? String(emp.usuarioId) : "",
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setFormData({ nombreEmpresa: "", cif: "", direccion: "", emailContacto: "", usuarioId: "" });
  };

  const cerrarModalCV = () => {
    setMostrarModalCV(false);
    setEmpresaPostularSeleccionada(null);
    setFormCV({ archivo: null, notas: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const propietarioId = miRol === "Admin" && formData.usuarioId ? parseInt(formData.usuarioId, 10) : miUsuarioId;

    try {
      if (editandoId) {
        await updateEmpresa(editandoId, {
          id: editandoId,
          ...formData,
          usuarioId: propietarioId,
          estadoAprobacion: todasLasEmpresas.find((e) => e.id === editandoId)?.estadoAprobacion || "Aprobado",
        });
      } else {
        await createEmpresa({
          ...formData,
          usuarioId: propietarioId,
          estadoAprobacion: "Aprobado",
        });
      }
      cerrarModal();
      cargarDatos();
    } catch {
      alert("Error al procesar la operación comercial.");
    }
  };

  const handleBaja = async (id) => {
    if (window.confirm("¿Confirmas la baja definitiva de esta adjudicataria del sistema VESTA?")) {
      try {
        await deleteEmpresa(id);
        alert("Empresa procesada correctamente (Baja registrada).");
        cargarDatos();
      } catch (error) {
        if (error.response?.status === 409) {
          alert(error.response.data?.mensaje || "No se puede dar de baja: existen lotes activos asignados.");
        } else {
          alert("No se puede tramitar la baja de la empresa.");
        }
      }
    }
  };

const handleReactivarEmpresa = async (emp) => {
    if (window.confirm(`¿Deseas revocar la baja y reactivar la homologación oficial de ${emp.nombreEmpresa}?`)) {
      try {
        // 1. Intentamos recuperar el ID desde el almacenamiento local
        let miAyuntamientoId = 
          parseInt(localStorage.getItem("idAyuntamiento"), 10) || 
          parseInt(localStorage.getItem("ayuntamientoId"), 10) || 
          null;

        // 2. 🛡️ SALVAGUARDA PARA EL ADMIN: Si es Admin y viene null, heredamos el ID que ya tenía la propia empresa
        if (!miAyuntamientoId && miRol === "Admin") {
          miAyuntamientoId = emp.ayuntamientoId || emp.AyuntamientoId || null;
        }

        console.log("Enviando reactivación con Ayuntamiento ID:", miAyuntamientoId);

        // 3. Si sigue siendo null y no es Admin, entonces sí bloqueamos de forma segura
        if (!miAyuntamientoId && miRol !== "Admin") {
          alert("Error local: No se ha detectado el ID de tu Ayuntamiento en la sesión. Por favor, reasigna tu login.");
          return;
        }

        // Enviamos el estado, el rol y el id del ayuntamiento real en el body (o null si el Admin crea una empresa global)
        await api.put(`/Empresas/${emp.id}/cambiar-estado`, { 
          Estado: "Aprobado",
          RolUsuario: miRol,
          AyuntamientoId: miAyuntamientoId
        });

        alert("¡Empresa dada de alta con éxito! Su gestor vuelve a tener el rol activo.");
        cargarDatos();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          const mensajeServidor = error.response.data?.mensaje || error.response.data;
          alert("CONFIGURACIÓN DENEGADA POR PROTOCOLO VESTA\n\n" + 
            (typeof mensajeServidor === "string" ? mensajeServidor : "No tienes permisos sobre esta empresa o existen incompatibilidades operativas."));
        } else {
          alert("Error de comunicación con el servidor al intentar dar de alta la adjudicataria.");
        }
      }
    }
  };

  const handleSolicitarBajaPropia = async (emp) => {
    if (window.confirm(`¿Confirmas que deseas solicitar la BAJA de "${emp.nombreEmpresa}"?\n\ Tu empresa pasará al registro de inactivas del Ayuntamiento.`)) {
      try {
        await api.put(`/Empresas/${emp.id}`, {
          id: emp.id,
          nombreEmpresa: emp.nombreEmpresa,
          cif: emp.cif,
          direccion: emp.direccion || "",
          emailContacto: emp.emailContacto,
          usuarioId: emp.usuarioId,
          estadoAprobacion: "Baja",
        });
        alert("Solicitud de baja procesada. La empresa se ha trasladado al archivo histórico.");
        cargarDatos();
        } catch (error) {
          if (error.response?.status === 409) {
            alert("No se puede dar de baja: " + (error.response.data?.mensaje || "existen lotes activos asignados a esta empresa."));
          } else {
            alert("Error al comunicar la solicitud de cese administrativo.");
          }
        }
    }
  };

const handleDimitirContrato = async (empresaId, nombreEmpresa) => {
    if (!empresaId) {
      alert("Error interno: No se pudo identificar el código de la empresa.");
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas tramitar tu baja voluntaria de "${nombreEmpresa}"?`)) {
      try {
        // Reutilizamos tu endpoint DELETE del backend que elimina la relación contractual
        // Ruta física en C#: api/Empresas/{empresaId}/despedir-trabajador/{usuarioId}
        await api.delete(`/Empresas/${empresaId}/despedir-trabajador/${miUsuarioId}`);
        
        alert("Gestión completada. Has causado baja voluntaria con éxito.");
        setVistaActiva("todas");
        cargarDatos();
      } catch (error) {
        console.error("Error al procesar la baja voluntaria:", error.response);
        alert(error.response?.data?.mensaje || "No se pudo tramitar tu dimisión.");
      }
    }
  };

  const abrirModalPostulacion = (emp) => {
    if (tieneEmpresaActiva) {
      alert("OPERACIÓN DENEGADA por Protocolo VESTA:\n\nNo puedes enviar currículums si eres administrador de una contrata activa.");
      return;
    }
    setEmpresaPostularSeleccionada(emp);
    setFormCV({ archivo: null, notas: "" });
    setMostrarModalCV(true);
  };

const handleSubmitPostulacionReal = async (e) => {
    e.preventDefault();
    if (!formCV.archivo) {
      alert("Por favor, selecciona un archivo PDF válido.");
      return;
    }
    try {
      const datosParaEnvio = new FormData();
      
      datosParaEnvio.append("usuarioId", miUsuarioId);
      datosParaEnvio.append("empresaId", empresaPostularSeleccionada.id);
      
      const textoNotas = formCV.notas && formCV.notas.trim() !== "" 
        ? formCV.notas.trim() 
        : "Sin notas adicionales.";
        
      datosParaEnvio.append("notas", textoNotas);
      datosParaEnvio.append("curriculumFile", formCV.archivo);

      await postularseAEmpresa(datosParaEnvio);
      alert(`¡Éxito! Tu currículum ha sido transferido a la bolsa de empleo.`);
      cerrarModalCV();
      cargarDatos();
    } catch (error) {
      console.error("Detalles del error del servidor:", error.response?.data);
      
      // 1. Capturamos el mensaje que envía el backend (ya sea en .mensaje, .message o dentro de errors)
      const dataServidor = error.response?.data;
      const mensajeServidor = typeof dataServidor === "string" 
        ? dataServidor 
        : dataServidor?.mensaje || dataServidor?.message || "";

      // 2. Comprobamos si el mensaje o el estado indican que ya está registrado
      if (
        error.response?.status === 409 || // Código HTTP para Conflicto (Muy común para duplicados)
        mensajeServidor.toLowerCase().includes("ya") || 
        mensajeServidor.toLowerCase().includes("existe") ||
        mensajeServidor.toLowerCase().includes("postulado")
      ) {
        alert(`AVISO DE ADMISIÓN:\n\nYa has enviado tu currículum a ${empresaPostularSeleccionada?.nombreEmpresa} previamente. Tu candidatura ya se encuentra en su base de datos.`);
      } else if (dataServidor?.errors?.notas) {
        // Mantenemos la alerta por si las notas fallaran por otra razón
        alert("Error en las notas:\n" + dataServidor.errors.notas[0]);
      } else {
        // Alerta genérica por si cae el servidor o hay otro problema técnico
        alert("Información del sistema:\n" + (mensajeServidor || "No se ha podido procesar la candidatura en este momento."));
      }
      
      cerrarModalCV(); // Cerramos el modal de todas formas para limpiar la pantalla
    }
  };

  // --- ESTILOS ---
  const styles = {
    tabBtn: { padding: "10px 18px", fontSize: "14px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s ease" },
    sinDatos: { color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px" }
  };

  const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
  const modalContentStyle = { backgroundColor: "#fff", padding: "30px", borderRadius: "12px", width: "450px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "4px" };
  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" };

  return (
    <div className="vista-page-container">
      <Sidebar />
      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Catálogo de Empresas Adjudicatarias</h1>
          <p>Registro oficial de contratistas homologados del sector de prestación de servicios municipales.</p>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        {miRol === "Admin" || miRol === "Ayuntamiento" ? (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setVistaActiva("activas")}
              style={{ ...styles.tabBtn, backgroundColor: vistaActiva === "activas" ? "#0284c7" : "#e2e8f0", color: vistaActiva === "activas" ? "#fff" : "#475569" }}
            >
              Empresas Homologadas Activas
            </button>
            <button
              onClick={() => setVistaActiva("ceses")}
              style={{ ...styles.tabBtn, backgroundColor: vistaActiva === "ceses" ? "#eab308" : "#e2e8f0", color: vistaActiva === "ceses" ? "#fff" : "#475569" }}
            >
              Solicitudes de Baja e Inactivas
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {miRol === "Empresa" && (
              <button
                onClick={() => setVistaActiva("propias")}
                style={{ ...styles.tabBtn, backgroundColor: vistaActiva === "propias" ? "#0284c7" : "#e2e8f0", color: vistaActiva === "propias" ? "#fff" : "#475569" }}
              >
                Mis Empresas Registradas
              </button>
            )}

            {miRol === "Trabajador" && tieneContratosActivos && (
              <button
                onClick={() => setVistaActiva("trabajando")}
                style={{ ...styles.tabBtn, backgroundColor: vistaActiva === "trabajando" ? "#10b981" : "#e2e8f0", color: vistaActiva === "trabajando" ? "#fff" : "#475569" }}
              >
                Trabajando en...
              </button>
            )}
            {miRol === "Trabajador" && (
              <button
                onClick={() => setVistaActiva("todas")}
                style={{ ...styles.tabBtn, backgroundColor: vistaActiva === "todas" ? "#0284c7" : "#e2e8f0", color: vistaActiva === "todas" ? "#fff" : "#475569" }}
              >
                Catálogo General (Buscar Empleo)
              </button>
            )}
          </div>
        )}

        <div className="modulo-tarjeta-blanca">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "600" }}>
              {miRol === "Admin" || miRol === "Ayuntamiento"
                ? vistaActiva === "activas" ? "Entidades Homologadas Globales" : "Historial de Entidades en Cese / Inactivas"
                : vistaActiva === "propias" ? "Tus Empresas en Propiedad" : vistaActiva === "trabajando" ? "Tu Destino Laboral Actual" : "Oferta de Contratistas del Municipio"}
            </h2>

            {miRol === "Admin" && (
              <button className="btn-vesta primario" onClick={abrirModalCrear}>
                + Nueva Empresa
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: "#64748b" }}>Análisis de registros comerciales en curso...</p>
          ) : empresasFiltradas.length === 0 ? (
            <p style={styles.sinDatos}>
              {vistaActiva === "trabajando" ? "Actualmente estás libre en la bolsa de empleo." : "No hay empresas homologadas disponibles en esta sección."}
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Denominación Social</th>
                  <th>C.I.F</th>
                  <th>Dirección</th>
                  <th>Contacto Operativo</th>
                  <th>Lotes Asignados</th>
                  <th>Centros e Instalaciones</th>
                  <th>Documentos Pliego</th>
                  {(miRol === "Admin" || miRol === "Ayuntamiento") && <th>Estado Interno</th>}
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((emp) => {
                  // --- CORRECCIÓN CLAVE: Lotes estructurados como array ---
                  const listadoLotes = Array.isArray(emp.lotesAsignados) ? emp.lotesAsignados : [];

                  return (
                    <tr key={emp.id}>
                      <td><strong style={{ color: "#1e293b" }}>{emp.nombreEmpresa}</strong></td>
                      <td style={{ fontFamily: "monospace", color: "#475569" }}>{emp.cif}</td>
                      <td style={{ color: "#475569" }}>{emp.direccion || "---"}</td>
                      <td style={{ color: "#475569" }}>{emp.emailContacto}</td>
                      <td>
                        {listadoLotes.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {listadoLotes.map((loteName, idx) => (
                              <span key={idx} style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                                {loteName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>No asignado</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {emp.centrosCargados && emp.centrosCargados.length > 0 ? (
                            emp.centrosCargados.map((centro) => (
                              <span key={centro.id} style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                                {centro.nombre} ({centro.localidad})
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Sin centros</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {emp.pliegosCargados && emp.pliegosCargados.length > 0 ? (
                            emp.pliegosCargados.map((pliego) => (
                              <a key={pliego.pliegoId} href={`http://localhost:5125${pliego.ruta}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: "500" }} title={pliego.descripcion}>
                                {pliego.nombrePliego}
                              </a>
                            ))
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Sin pliegos</span>
                          )}
                        </div>
                      </td>
                      {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                        <td>
                          <span style={{ fontSize: "13px", fontWeight: "500", color: emp.estadoAprobacion === "Baja" ? "#ef4444" : "#10b981" }}>
                            {emp.estadoAprobacion || "Aprobado"}
                          </span>
                        </td>
                      )}
                      <td style={{ textAlign: "right" }}>
                        {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            {miRol === "Admin" && (
                              <button className="btn-vesta secundario" onClick={() => prepararEdicion(emp)}>Editar</button>
                            )}
                            {vistaActiva === "ceses" ? (
                              // CONDICIÓN MEJORADA: Comprobamos si es Admin, o si es Ayuntamiento y coincide el ID (soportando tanto A mayúscula como minúscula)
                              miRol === "Admin" || 
                              (miRol === "Ayuntamiento" && 
                                (
                                  // Compara ignorando si el backend envió el dato en minúsculas o mayúsculas
String(emp.ayuntamientoId || emp.AyuntamientoId || "") === String(localStorage.getItem("idAyuntamiento") || localStorage.getItem("ayuntamientoId"))
                                )
                              ) ? (
                                <button 
                                  className="btn-vesta profesional" 
                                  style={{ backgroundColor: "#10b981", color: "#fff", padding: "6px 12px", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }} 
                                  onClick={() => handleReactivarEmpresa(emp)}
                                >
                                  Dar de Alta
                                </button>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                                  Bloqueado por otro Municipio
                                </span>
                              )
                            ) : (
                              miRol === "Admin" && <button className="btn-vesta peligro" onClick={() => handleBaja(emp.id)}>Dar de Baja</button>
                            )}
                          </div>
                        )}

                        {miRol !== "Admin" && miRol !== "Ayuntamiento" && vistaActiva === "propias" && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button className="btn-vesta secundario" style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => prepararEdicion(emp)}>Ajustes</button>
                            {emp.estado !== "Solicitada Baja" && emp.estadoAprobacion !== "Baja" ? (
                              <button className="btn-vesta peligro" style={{ padding: "5px 12px", fontSize: "12px", backgroundColor: "#e83838", color: "#fff" }} onClick={() => handleSolicitarBajaPropia(emp)}>
                                Dar de Baja
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#e83838", alignSelf: "center", fontStyle: "italic" }}>
                                {emp.estadoAprobacion === "Baja" ? "Baja Confirmada" : "Baja en Trámite..."}
                              </span>
                            )}
                          </div>
                        )}

                        {miRol === "Trabajador" && vistaActiva === "trabajando" && (
                          <button className="btn-vesta peligro" style={{ padding: "6px 14px", fontSize: "12px", backgroundColor: "#dc2626", color: "#fff", fontWeight: "700" }} onClick={() => handleDimitirContrato(emp.id, emp.nombreEmpresa)}>
                            Dimitir de la Empresa
                          </button>
                        )}

                        {miRol !== "Admin" && miRol !== "Ayuntamiento" && vistaActiva === "todas" && (
                          <button
                            className="btn-vesta primario"
                            style={{ backgroundColor: tieneEmpresaActiva ? "#cbd5e1" : "#10b981", color: tieneEmpresaActiva ? "#64748b" : "#fff", padding: "5px 12px", fontSize: "12px", cursor: tieneEmpresaActiva ? "not-allowed" : "pointer" }}
                            onClick={() => abrirModalPostulacion(emp)}
                            disabled={tieneEmpresaActiva}
                          >
                            {tieneEmpresaActiva ? "Bloqueado" : "Enviar CV"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL GESTIÓN EMPRESAS */}
      {mostrarModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>
              {editandoId ? "Modificar Parámetros Adjudicatario" : "Registrar Nueva Entidad Homologada"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Razón Social / Nombre</label>
                <input type="text" value={formData.nombreEmpresa} onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>C.I.F.</label>
                <input type="text" value={formData.cif} onChange={(e) => setFormData({ ...formData, cif: e.target.value })} required style={inputStyle} />
              </div>

              {miRol === "Admin" && (
                <div>
                  <label style={labelStyle}>Asignar Usuario Propietario / Gestor</label>
                  <select value={formData.usuarioId} onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })} required style={inputStyle}>
                    <option value="">-- Seleccionar Cuenta de Destino --</option>
                    {usuariosDisponibles.map((u) => {
                      const uid = u.Id || u.id;
                      return (
                        <option key={uid} value={uid}>
                          {u.Nombre || u.nombre || u.Email || u.email} (ID: {uid})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Dirección Sede</label>
                <input type="text" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email de Contacto</label>
                <input type="email" value={formData.emailContacto} onChange={(e) => setFormData({ ...formData, emailContacto: e.target.value })} required style={inputStyle} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="btn-vesta secundario" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-vesta primario">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENVIAR CV / POSTULACIÓN */}
      {mostrarModalCV && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>
              Postularse a {empresaPostularSeleccionada?.nombreEmpresa}
            </h2>
            <form onSubmit={handleSubmitPostulacionReal} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Currículum Vitae (PDF)</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf"
                  required
                  onChange={(e) => setFormCV({ ...formCV, archivo: e.target.files[0] })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Notas adicionales / Presentación</label>
                <textarea 
                  value={formCV.notas} // Corregido: "notas" en lugar de "notes"
                  onChange={(e) => setFormCV({ ...formCV, notas: e.target.value })}
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                  placeholder="Escribe un mensaje breve para la empresa..."
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="btn-vesta secundario" onClick={cerrarModalCV}>Cancelar</button>
                <button type="submit" className="btn-vesta primario">Enviar Candidatura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};