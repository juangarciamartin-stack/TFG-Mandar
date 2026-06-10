import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  getIncidenciasPorEmpresa,
  getMisContratasTrabajador,
  createIncidencia,
  updateIncidencia,
  getIncidencias,
} from "../services/incidenciaService";
import { getMisEmpresasSelector } from "../services/usuarioService";
import "./Dashboard.css";

const obtenerIdDesdeToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || payload.nameid || null;
  } catch (error) {
    console.error("Error al descodificar el token JWT:", error);
    return null;
  }
};

export const Incidencias = () => {
  const miRol = localStorage.getItem("rol") || "Trabajador";
  const idGuardado = localStorage.getItem("usuarioId");
  const miUsuarioId =
    idGuardado && idGuardado !== "undefined"
      ? parseInt(idGuardado)
      : parseInt(obtenerIdDesdeToken() || "0");

  const esAdminOAyuntamiento = miRol === "Admin" || miRol === "Ayuntamiento";

  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [selectorEmpresas, setSelectorEmpresas] = useState([]);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState("");

  const [datosEmpresaActiva, setDatosEmpresaActiva] = useState(null);

  const [empresasFormularioModal, setEmpresasFormularioModal] = useState([]);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    gravedad: "Baja",
    empresaId: "",
  });

 const inicializarComponente = async () => {
    try {
      setLoading(true);
      
      // 🚀 Llamamos directamente al endpoint unificado que ya gestiona los roles en el Backend
      const listadoParaSelector = (await getMisContratasTrabajador()) || [];

      // 🔥 FILTRO: Solo dejamos pasar las empresas que NO estén pendientes de aceptación
      const empresasFiltradas = listadoParaSelector.filter(
        (emp) => (emp.estadoEmpresa || emp.EstadoEmpresa) !== "Pendiente"
      );

      setSelectorEmpresas(empresasFiltradas);

      if (empresasFiltradas.length > 0) {
        const primeraEmpresaId =
          empresasFiltradas[0].id || empresasFiltradas[0].Id;
        setEmpresaSeleccionadaId(primeraEmpresaId);
        setDatosEmpresaActiva(empresasFiltradas[0]);
      } else {
        setEmpresaSeleccionadaId("");
        setDatosEmpresaActiva(null);
        await cargarIncidenciasGeneral();
      }
    } catch (error) {
      console.error("Error inicializando panel de incidencias:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    inicializarComponente();
  }, [miRol]);

  useEffect(() => {
    if (!empresaSeleccionadaId || selectorEmpresas.length === 0) return;

    const empresaActual = selectorEmpresas.find(
      (e) => (e.id || e.Id) === parseInt(empresaSeleccionadaId),
    );

    if (empresaActual) {
      setDatosEmpresaActiva(empresaActual);
    }

    cargarIncidenciasFiltroEmpresa(empresaSeleccionadaId);
  }, [empresaSeleccionadaId, selectorEmpresas]);

  const cargarIncidenciasFiltroEmpresa = async (idEmpresa) => {
    try {
      setLoading(true);
      const data = await getIncidenciasPorEmpresa(idEmpresa);
      setIncidencias(data);
    } catch {
      alert("Error al cargar las incidencias de esta contrata");
    } finally {
      setLoading(false);
    }
  };

  const cargarIncidenciasGeneral = async () => {
    try {
      setLoading(true);
      const data = await getIncidencias();
      setIncidencias(
        data.filter(
          (inc) => inc.nombreEmpresa !== null && inc.empresaId !== null,
        ),
      );
    } catch {
      alert("Error al sincronizar tu buzón de avisos");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (incidencia, nuevoEstado) => {
    try {
      const incidenciaActualizada = {
        id: incidencia.id,
        titulo: incidencia.titulo,
        descripcion: incidencia.descripcion,
        gravedad: incidencia.gravedad,
        usuarioId: incidencia.usuarioId,
        empresaId: incidencia.empresaId,
        loteId: incidencia.loteId,
        estado: nuevoEstado,
      };

      await updateIncidencia(incidencia.id, incidenciaActualizada);

      if (empresaSeleccionadaId) {
        cargarIncidenciasFiltroEmpresa(empresaSeleccionadaId);
      } else {
        cargarIncidenciasGeneral();
      }
    } catch (error) {
      const msg =
        error.response?.data?.mensaje ||
        "No tienes los permisos requeridos para alterar esta incidencia.";
      alert(msg);
    }
  };

 const abrirModal = async () => {
    setFormData({
      titulo: "",
      descripcion: "",
      gravedad: "Baja",
      empresaId: "",
    });

    try {
      // 🚀 Llamamos al endpoint unificado
      const listaContratas = (await getMisContratasTrabajador()) || [];
      let opcionesEmpresa = [];

      if (esAdminOAyuntamiento) {
        opcionesEmpresa = listaContratas;
      } else {
        opcionesEmpresa = listaContratas.filter(
          (e) =>
            e.tipoRelacion === "Empleado" ||
            (e.tipoRelacion === "Dueño" && e.estadoEmpresa !== "Baja"),
        );
      }

      // 🔥 FILTRO: Nos aseguramos de limpiar también el modal de creación
      const opcionesValidadas = opcionesEmpresa.filter(
        (emp) => (emp.estadoEmpresa || emp.EstadoEmpresa) !== "Pendiente"
      );

      setEmpresasFormularioModal(opcionesValidadas);

      if (opcionesValidadas.length > 0) {
        const defaultId = opcionesValidadas[0].id || opcionesValidadas[0].Id;
        setFormData((prev) => ({
          ...prev,
          empresaId: defaultId,
        }));
      }
    } catch (error) {
      console.error("Error al recopilar tus empresas adscritas:", error);
    }
    setMostrarModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.empresaId) {
        alert("Debes asignar la incidencia a una empresa válida.");
        return;
      }

      const nuevaIncidencia = {
        id: 0,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        gravedad: formData.gravedad,
        estado: "Pendiente",
        usuarioId: miUsuarioId,
        empresaId: parseInt(formData.empresaId),
        loteId: null,
      };

      await createIncidencia(nuevaIncidencia);
      setMostrarModal(false);

      if (empresaSeleccionadaId) {
        cargarIncidenciasFiltroEmpresa(empresaSeleccionadaId);
      } else {
        cargarIncidenciasGeneral();
      }
    } catch {
      alert("Error al enviar el reporte técnico.");
    }
  };

  const puedeModificarEstado = (incidencia) => {
    if (esAdminOAyuntamiento) return true;
    const esElDuenoDeEstaEmpresa =
      incidencia.duenoEmpresaId === miUsuarioId && miUsuarioId !== 0;

    if (
      datosEmpresaActiva?.estadoEmpresa === "Baja" ||
      datosEmpresaActiva?.EstadoEmpresa === "Baja"
    )
      return false;

    return esElDuenoDeEstaEmpresa;
  };

  const esHistoricoDeBaja = datosEmpresaActiva
    ? datosEmpresaActiva.estadoEmpresa === "Baja" ||
      datosEmpresaActiva.EstadoEmpresa === "Baja"
    : false;

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#334155",
    outline: "none",
  };
  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "600",
    fontSize: "13px",
    color: "#334155",
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
            gap: "20px",
          }}
        >
          <div>
            <h1>Centro de Incidencias</h1>
            <p>
              {esHistoricoDeBaja
                ? "Visualizando el archivo histórico inactivo de tu antigua contrata."
                : "Gestiona, consulta y reporta las anomalías operativas de tu entorno de trabajo."}
            </p>
          </div>

          {selectorEmpresas.length > 0 && (
            <div style={{ minWidth: "320px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#475569",
                  marginBottom: "4px",
                  textTransform: "uppercase",
                }}
              >
                Seleccionar Entorno / Contrata:
              </label>
              <select
                style={{
                  ...inputStyle,
                  border: esHistoricoDeBaja
                    ? "2px solid #64748b"
                    : "2px solid #0284c7",
                  fontSize: "14px",
                  fontWeight: "600",
                  backgroundColor: esHistoricoDeBaja ? "#f1f5f9" : "#f0f9ff",
                }}
                value={empresaSeleccionadaId}
                onChange={(e) => setEmpresaSeleccionadaId(e.target.value)}
              >
                {selectorEmpresas.map((emp) => (
                  <option key={emp.id || emp.Id} value={emp.id || emp.Id}>
                    {emp.nombreEmpresa || emp.NombreEmpresa}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modulo-tarjeta-blanca">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              {esHistoricoDeBaja
                ? "Registro Histórico de Incidencias (Solo Lectura)"
                : "Buzón Técnico y de Infraestructura Operativa"}
            </h2>

            {(esAdminOAyuntamiento || !esHistoricoDeBaja) && (
              <button className="btn-vesta primario" onClick={abrirModal}>
                Reportar Incidencia
              </button>
            )}
          </div>

          {loading ? (
            <p style={{ color: "#64748b" }}>Cargando buzón de incidencias...</p>
          ) : incidencias.length === 0 ? (
            <p style={{ color: "#64748b", padding: "20px 0" }}>
              No se registran incidencias en esta contrata.
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Asunto</th>
                  <th>Detalle</th>
                  <th>Empresa Afectada</th>
                  <th>Gravedad</th>
                  <th>Estado Actual</th>
                  <th style={{ textAlign: "right" }}>Acción Técnica</th>
                </tr>
              </thead>
              <tbody>
                {incidencias.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <strong style={{ color: "#1e293b" }}>{inc.titulo}</strong>
                    </td>
                    <td style={{ color: "#475569" }}>{inc.descripcion}</td>
                    <td>
                      <span style={{ color: "#334155", fontSize: "13px" }}>
                        {inc.nombreEmpresa}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            inc.gravedad === "Alta"
                              ? "#fee2e2"
                              : inc.gravedad === "Media"
                                ? "#fef3c7"
                                : "#f0fdf4",
                          color:
                            inc.gravedad === "Alta"
                              ? "#991b1b"
                              : inc.gravedad === "Media"
                                ? "#92400e"
                                : "#166534",
                        }}
                      >
                        {inc.gravedad || "Baja"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "13px",
                          color:
                            inc.estado === "Resuelto"
                              ? "#166534"
                              : inc.estado === "En Proceso"
                                ? "#2563eb"
                                : "#b91c1c",
                        }}
                      >
                        {inc.estado || "Pendiente"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {puedeModificarEstado(inc) ? (
                        <>
                          {inc.estado !== "En Proceso" &&
                            inc.estado !== "Resuelto" && (
                              <button
                                className="btn-vesta secundario"
                                style={{
                                  marginRight: "8px",
                                  padding: "6px 12px",
                                  fontSize: "12px",
                                }}
                                onClick={() =>
                                  handleCambiarEstado(inc, "En Proceso")
                                }
                              >
                                En Reparación 🛠️
                              </button>
                            )}
                          {inc.estado !== "Resuelto" && (
                            <button
                              className="btn-vesta primario"
                              style={{
                                backgroundColor: "#10b981",
                                padding: "6px 12px",
                                fontSize: "12px",
                              }}
                              onClick={() =>
                                handleCambiarEstado(inc, "Resuelto")
                              }
                            >
                              Corregida
                            </button>
                          )}
                          {inc.estado === "Resuelto" && (
                            <span
                              style={{
                                color: "#10b981",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Solucionado ✅
                            </span>
                          )}
                        </>
                      ) : (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            fontStyle: "italic",
                          }}
                        >
                          Solo lectura
                        </span>
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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "32px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <h2 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
              Registrar Nueva Incidencia
            </h2>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              {esAdminOAyuntamiento
                ? "Como administrador público, puedes reportar un aviso técnico a cualquier contrata."
                : "Rellena los detalles del percance para su revisión."}
            </p>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label style={labelStyle}>Asignar a la Empresa Actual:</label>
                <select
                  name="empresaId"
                  value={formData.empresaId}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  {empresasFormularioModal.length === 0 ? (
                    <option value="">
                      -- No se han localizado empresas activas --
                    </option>
                  ) : (
                    empresasFormularioModal.map((emp) => (
                      <option key={emp.id || emp.Id} value={emp.id || emp.Id}>
                        {emp.nombreEmpresa || emp.NombreEmpresa}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Asunto / Título Breve</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Avería eléctrica en zona norte"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Descripción Técnica del Problema
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                  placeholder="Indica los detalles..."
                  style={{ ...inputStyle, height: "100px", resize: "none" }}
                />
              </div>
              <div>
                <label style={labelStyle}>Nivel de Urgencia Estimado</label>
                <select
                  name="gravedad"
                  value={formData.gravedad}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Baja">🟢 Baja</option>
                  <option value="Media">🟡 Media</option>
                  <option value="Alta">🔴 Alta</option>
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <button
                  type="button"
                  className="btn-vesta secundario"
                  onClick={() => setMostrarModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-vesta primario"
                  disabled={empresasFormularioModal.length === 0}
                >
                  Enviar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
