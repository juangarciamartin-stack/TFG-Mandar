import React, { useEffect, useState, useCallback } from "react";
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
  const [todasLasEmpresas, setTodasLasEmpresas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  const [vistaActiva, setVistaActiva] = useState("propias");

  const [mostrarModalCV, setMostrarModalCV] = useState(false);
  const [empresaPostularSeleccionada, setEmpresaPostularSeleccionada] =
    useState(null);
  const [formCV, setFormCV] = useState({ archivo: null, notas: "" });

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    cif: "",
    direccion: "",
    emailContacto: "",
    usuarioId: "",
  });

  const miRol = localStorage.getItem("rol") || "Trabajador";
  const miUsuarioId = parseInt(localStorage.getItem("usuarioId")) || 0;

  const [idEmpresaContratado, setIdEmpresaContratado] = useState([]);

  const tieneEmpresaActiva = todasLasEmpresas.some(
    (e) => e.usuarioId === miUsuarioId && e.estadoAprobacion === "Aprobado",
  );

  const cargarUsuarios = useCallback(async () => {
    if (miRol === "Admin") {
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
    }
  }, [miRol]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEmpresas();
      const listaEmpresas = Array.isArray(data) ? data : data?.data || [];
      setTodasLasEmpresas(listaEmpresas);

      if (miRol === "Trabajador") {
        try {
          const contratas = await getMisContratasTrabajador();
          if (contratas && contratas.length > 0) {
            const todosLosIdsActivos = contratas.map(
              (c) => c.empresaId || c.EmpresaId || c.id || c.Id,
            );
            setIdEmpresaContratado(todosLosIdsActivos);
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
    if (miRol === "Admin" || miRol === "Ayuntamiento") {
      setVistaActiva("activas");
    } else {
      setVistaActiva("propias");
    }
  }, [miRol, cargarDatos, cargarUsuarios]);

  useEffect(() => {
    if (miRol === "Admin" || miRol === "Ayuntamiento") {
      if (vistaActiva === "activas") {
        setEmpresasFiltradas(
          todasLasEmpresas.filter(
            (e) => e.estadoAprobacion === "Aprobado" || !e.estadoAprobacion,
          ),
        );
      } else if (vistaActiva === "ceses") {
        setEmpresasFiltradas(
          todasLasEmpresas.filter(
            (e) =>
              e.estado === "Solicitada Baja" || e.estadoAprobacion === "Baja",
          ),
        );
      }
    } else {
      if (vistaActiva === "propias") {
        const misPropiedades = todasLasEmpresas.filter(
          (e) => e.usuarioId === miUsuarioId,
        );
        setEmpresasFiltradas(misPropiedades);
      } else if (vistaActiva === "trabajando") {
        const empresasDondeTrabaja = todasLasEmpresas.filter(
          (e) =>
            idEmpresaContratado.includes(e.id) &&
            e.estadoAprobacion === "Aprobado",
        );
        setEmpresasFiltradas(empresasDondeTrabaja);
      } else {
        const catalogoPublico = todasLasEmpresas.filter(
          (e) =>
            e.usuarioId !== miUsuarioId &&
            e.estadoAprobacion !== "Baja" &&
            !idEmpresaContratado.includes(e.id),
        );
        setEmpresasFiltradas(catalogoPublico);
      }
    }
  }, [vistaActiva, todasLasEmpresas, idEmpresaContratado, miRol, miUsuarioId]);

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({
      nombreEmpresa: "",
      cif: "",
      direccion: "",
      emailContacto: "",
      usuarioId: "",
    });
    setMostrarModal(true);
  };

  const prepararEdicion = (emp) => {
    setEditandoId(emp.id);
    setFormData({
      nombreEmpresa: emp.nombreEmpresa,
      cif: emp.cif,
      direccion: emp.direccion || "",
      emailContacto: emp.emailContacto,
      usuarioId: emp.usuarioId || "",
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setFormData({
      nombreEmpresa: "",
      cif: "",
      direccion: "",
      emailContacto: "",
      usuarioId: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const propietarioId =
      miRol === "Admin" && formData.usuarioId
        ? parseInt(formData.usuarioId)
        : miUsuarioId;

    try {
      if (editandoId) {
        await updateEmpresa(editandoId, {
          id: editandoId,
          ...formData,
          usuarioId: propietarioId,
          estadoAprobacion:
            todasLasEmpresas.find((e) => e.id === editandoId)
              ?.estadoAprobacion || "Aprobado",
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
    if (
      window.confirm(
        "¿Confirmas la baja definitiva de esta adjudicataria del sistema VESTA?",
      )
    ) {
      try {
        await deleteEmpresa(id);
        alert(" Empresa procesada correctamente (Baja registrada).");
        cargarDatos();
      } catch {
        alert(
          "No se puede tramitar la baja de la empresa porque contiene vinculaciones, lotes o personal activo.",
        );
      }
    }
  };

  const handleReactivarEmpresa = async (id) => {
    if (
      window.confirm(
        "¿Deseas revocar la baja y reactivar la homologación oficial de esta empresa?",
      )
    ) {
      try {
        await api.put(`/Empresas/${id}/cambiar-estado`, { Estado: "Aprobado" });
        alert(
          "¡Empresa dada de alta con éxito! Su gestor vuelve a tener el rol activo.",
        );
        cargarDatos();
      } catch (error) {
        if (error.response && error.response.status === 400) {
          const mensajeServidor =
            error.response.data?.mensaje || error.response.data;
          alert(
            "CONFIGURACIÓN DENEGADA POR PROTOCOLO VESTA\n\n" +
              (typeof mensajeServidor === "string"
                ? mensajeServidor
                : "El usuario titular posee actualmente un contrato laboral de operario activo."),
          );
        } else {
          alert(
            "Error de comunicación con el servidor al intentar dar de alta la adjudicataria.",
          );
        }
      }
    }
  };

  const handleSolicitarBajaPropia = async (emp) => {
    if (
      window.confirm(
        `¿Confirmas que deseas solicitar la BAJA de "${emp.nombreEmpresa}"?\n\nTu empresa pasará al registro de inactivas del Ayuntamiento.`,
      )
    ) {
      try {
        await api.put(`/Empresas/${emp.id}`, {
          ...emp,
          estadoAprobacion: "Baja",
        });
        alert(
          "Solicitud de baja procesada. La empresa se ha trasladado al archivo histórico.",
        );
        cargarDatos();
      } catch {
        alert("Error al comunicar la solicitud de cese administrativo.");
      }
    }
  };

  const handleDimitirContrato = async (empresaId, nombreEmpresa) => {
    if (!empresaId) {
      alert("Error interno: No se pudo identificar el código de la empresa.");
      return;
    }
    if (
      window.confirm(
        `¿Estás seguro de que deseas tramitar tu baja voluntaria de "${nombreEmpresa}"?`,
      )
    ) {
      try {
        await api.put(
          `/Empresas/dimitir-trabajador/${miUsuarioId}?empresaId=${empresaId}`,
        );
        alert("Gestión completada. Has causado baja voluntaria.");
        setVistaActiva("propias");
        cargarDatos();
      } catch (error) {
        alert(
          error.response?.data?.mensaje || "No se pudo tramitar tu dimisión.",
        );
      }
    }
  };

  const abrirModalPostulacion = (emp) => {
    if (tieneEmpresaActiva) {
      alert(
        "OPERACIÓN DENEGADA por Protocolo VESTA:\n\nNo puedes enviar currículums si eres administrador de una contrata activa.",
      );
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
      datosParaEnvio.append("notas", formCV.notas ? formCV.notas.trim() : "");
      datosParaEnvio.append("curriculumFile", formCV.archivo);

      await postularseAEmpresa(datosParaEnvio);
      alert(`¡Éxito! Tu currículum ha sido transferido a la bolsa de empleo.`);
      setMostrarModalCV(false);
      cargarDatos();
    } catch (error) {
      alert(error.response?.data?.mensaje || "Error al enviar la candidatura.");
    }
  };

  const tieneContratosActivos = todasLasEmpresas.some(
    (e) =>
      idEmpresaContratado.includes(e.id) && e.estadoAprobacion === "Aprobado",
  );

  return (
    <div className="vista-page-container">
      <Sidebar />
      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Catálogo de Empresas Adjudicatarias</h1>
          <p>
            Registro oficial de contratistas homologados del sector de
            prestación de servicios municipales.
          </p>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        {miRol === "Admin" || miRol === "Ayuntamiento" ? (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setVistaActiva("activas")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  vistaActiva === "activas" ? "#0284c7" : "#e2e8f0",
                color: vistaActiva === "activas" ? "#fff" : "#475569",
              }}
            >
              Empresas Homologadas Activas
            </button>
            <button
              onClick={() => setVistaActiva("ceses")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  vistaActiva === "ceses" ? "#eab308" : "#e2e8f0",
                color: vistaActiva === "ceses" ? "#fff" : "#475569",
              }}
            >
              Solicitudes de Baja e Inactivas
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button
              onClick={() => setVistaActiva("propias")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  vistaActiva === "propias" ? "#0284c7" : "#e2e8f0",
                color: vistaActiva === "propias" ? "#fff" : "#475569",
              }}
            >
              Mis Empresas Registradas
            </button>

            {miRol === "Trabajador" && tieneContratosActivos && (
              <button
                onClick={() => setVistaActiva("trabajando")}
                style={{
                  ...styles.tabBtn,
                  backgroundColor:
                    vistaActiva === "trabajando" ? "#10b981" : "#e2e8f0",
                  color: vistaActiva === "trabajando" ? "#fff" : "#475569",
                }}
              >
                Trabajando en...
              </button>
            )}

            <button
              onClick={() => setVistaActiva("todas")}
              style={{
                ...styles.tabBtn,
                backgroundColor:
                  vistaActiva === "todas" ? "#0284c7" : "#e2e8f0",
                color: vistaActiva === "todas" ? "#fff" : "#475569",
              }}
            >
              Catálogo General (Buscar Empleo)
            </button>
          </div>
        )}

        <div className="modulo-tarjeta-blanca">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                color: "#0f172a",
                fontWeight: "600",
              }}
            >
              {miRol === "Admin" || miRol === "Ayuntamiento"
                ? vistaActiva === "activas"
                  ? "Entidades Homologadas Globales"
                  : "Historial de Entidades en Cese / Inactivas"
                : vistaActiva === "propias"
                  ? "Tus Empresas en Propiedad"
                  : vistaActiva === "trabajando"
                    ? "Tu Destino Laboral Actual"
                    : "Oferta de Contratistas del Municipio"}
            </h2>

            {miRol === "Admin" && (
              <button className="btn-vesta primario" onClick={abrirModalCrear}>
                + Nueva Empresa
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: "#64748b" }}>
              Analizando registros comerciales...
            </p>
          ) : empresasFiltradas.length === 0 ? (
            <p style={styles.sinDatos}>
              {vistaActiva === "trabajando"
                ? "Actualmente estás libre en la bolsa de empleo."
                : "No hay empresas homologadas disponibles en esta sección."}
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Denominación Social</th>
                  <th>C.I.F</th>
                  <th>Dirección</th>
                  <th>Contacto Operativo</th>
                  {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                    <th>Estado Interno</th>
                  )}
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <strong style={{ color: "#1e293b" }}>
                        {emp.nombreEmpresa}
                      </strong>
                    </td>
                    <td style={{ fontFamily: "monospace", color: "#475569" }}>
                      {emp.cif}
                    </td>
                    <td style={{ color: "#475569" }}>
                      {emp.direccion || "---"}
                    </td>
                    <td style={{ color: "#475569" }}>{emp.emailContacto}</td>

                    {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor:
                              emp.estadoAprobacion === "Baja" ||
                              emp.estado === "Solicitada Baja"
                                ? "#fee2e2"
                                : "#d1fae5",
                            color:
                              emp.estadoAprobacion === "Baja" ||
                              emp.estado === "Solicitada Baja"
                                ? "#b91c1c"
                                : "#047857",
                          }}
                        >
                          {emp.estadoAprobacion === "Baja"
                            ? "Baja Histórica"
                            : emp.estado || "Activa"}
                        </span>
                      </td>
                    )}

                    <td style={{ textAlign: "right" }}>
                      {(miRol === "Admin" || miRol === "Ayuntamiento") && (
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          {miRol === "Admin" && (
                            <button
                              className="btn-vesta secundario"
                              onClick={() => prepararEdicion(emp)}
                            >
                              Editar
                            </button>
                          )}

                          {vistaActiva === "ceses" ? (
                            <button
                              className="btn-vesta profesional"
                              style={{
                                backgroundColor: "#10b981",
                                color: "#fff",
                                padding: "6px 12px",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                cursor: "pointer",
                                fontWeight: "600",
                              }}
                              onClick={() => handleReactivarEmpresa(emp.id)}
                            >
                              Dar de Alta
                            </button>
                          ) : (
                            miRol === "Admin" && (
                              <button
                                className="btn-vesta peligro"
                                onClick={() => handleBaja(emp.id)}
                              >
                                Dar de Baja
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {miRol !== "Admin" &&
                        miRol !== "Ayuntamiento" &&
                        vistaActiva === "propias" && (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              className="btn-vesta secundario"
                              style={{ padding: "5px 12px", fontSize: "12px" }}
                              onClick={() => prepararEdicion(emp)}
                            >
                              Ajustes
                            </button>
                            {emp.estado !== "Solicitada Baja" &&
                            emp.estadoAprobacion !== "Baja" ? (
                              <button
                                className="btn-vesta peligro"
                                style={{
                                  padding: "5px 12px",
                                  fontSize: "12px",
                                  backgroundColor: "#e83838",
                                  color: "#fff",
                                }}
                                onClick={() => handleSolicitarBajaPropia(emp)}
                              >
                                Dar de Baja
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#e83838",
                                  alignSelf: "center",
                                  fontStyle: "italic",
                                }}
                              >
                                {emp.estadoAprobacion === "Baja"
                                  ? "Baja Confirmada"
                                  : "Baja en Trámite..."}
                              </span>
                            )}
                          </div>
                        )}

                      {miRol === "Trabajador" &&
                        vistaActiva === "trabajando" && (
                          <button
                            className="btn-vesta peligro"
                            style={{
                              padding: "6px 14px",
                              fontSize: "12px",
                              backgroundColor: "#dc2626",
                              color: "#fff",
                              fontWeight: "700",
                            }}
                            onClick={() =>
                              handleDimitirContrato(emp.id, emp.nombreEmpresa)
                            }
                          >
                            Dimitir de la Empresa
                          </button>
                        )}

                      {miRol !== "Admin" &&
                        miRol !== "Ayuntamiento" &&
                        vistaActiva === "todas" && (
                          <button
                            className="btn-vesta primario"
                            style={{
                              backgroundColor: tieneEmpresaActiva
                                ? "#cbd5e1"
                                : "#10b981",
                              color: tieneEmpresaActiva ? "#64748b" : "#fff",
                              padding: "5px 12px",
                              fontSize: "12px",
                              cursor: tieneEmpresaActiva
                                ? "not-allowed"
                                : "pointer",
                            }}
                            onClick={() => abrirModalPostulacion(emp)}
                          >
                            {tieneEmpresaActiva ? "Bloqueado" : "Enviar CV"}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>
              {editandoId
                ? "Modificar Parámetros Adjudicatario"
                : "Registrar Nueva Entidad Homologada"}
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={labelStyle}>Razón Social / Nombre</label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreEmpresa: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>C.I.F.</label>
                <input
                  type="text"
                  value={formData.cif}
                  onChange={(e) =>
                    setFormData({ ...formData, cif: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
              </div>

              {miRol === "Admin" && (
                <div>
                  <label style={labelStyle}>
                    Asignar Usuario Propietario / Gestor
                  </label>
                  <select
                    value={formData.usuarioId}
                    onChange={(e) =>
                      setFormData({ ...formData, usuarioId: e.target.value })
                    }
                    required
                    style={inputStyle}
                  >
                    <option value="">
                      -- Seleccionar Cuenta de Destino --
                    </option>
                    {usuariosDisponibles.map((u) => (
                      <option key={u.Id || u.id} value={u.Id || u.id}>
                        {u.Nombre || u.nombre || u.Email || u.email} (ID:{" "}
                        {u.Id || u.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Dirección Sede</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email de Contacto</label>
                <input
                  type="email"
                  value={formData.emailContacto}
                  onChange={(e) =>
                    setFormData({ ...formData, emailContacto: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  className="btn-vesta secundario"
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-vesta primario">
                  {editandoId ? "Guardar Cambios" : "Dar de Alta Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CV */}
      {mostrarModalCV && empresaPostularSeleccionada && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2
              style={{
                margin: "0 0 5px 0",
                color: "#0f172a",
                fontSize: "18px",
              }}
            >
              Inscribirse en Bolsa
            </h2>
            <p
              style={{
                margin: "0 0 15px 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Vas a postularte a la contrata:{" "}
              <strong>{empresaPostularSeleccionada.nombreEmpresa}</strong>
            </p>
            <form
              onSubmit={handleSubmitPostulacionReal}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label style={labelStyle}>
                  Seleccionar Currículum Vitae (Formato PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  style={inputStyle}
                  onChange={(e) =>
                    setFormCV({ ...formCV, archivo: e.target.files[0] })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Notas aclaratorias (Opcional)</label>
                <textarea
                  placeholder="Ej: Disponibilidad horaria..."
                  value={formCV.notes}
                  onChange={(e) =>
                    setFormCV({ ...formCV, notas: e.target.value })
                  }
                  style={{
                    ...inputStyle,
                    height: "80px",
                    resize: "none",
                    fontFamily: "inherit",
                  }}
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
                  className="btn-vesta secundario"
                  onClick={() => setMostrarModalCV(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-vesta primario"
                  style={{ backgroundColor: "#10b981" }}
                >
                  Enviar Candidatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  tabBtn: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  bannerAviso: {
    backgroundColor: "#ffedd5",
    borderLeft: "4px solid #f97316",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "13px",
    color: "#c2410c",
  },
  sinDatos: {
    textAlign: "center",
    color: "#64748b",
    padding: "30px 0",
    fontSize: "14px",
  },
};
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  zIndex: 1000,
  justifyContent: "center",
};
const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "28px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "420px",
};
const labelStyle = {
  display: "block",
  marginBottom: "4px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#334155",
};
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};