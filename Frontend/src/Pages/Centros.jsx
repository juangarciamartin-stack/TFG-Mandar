import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../Components/Sidebar";
import {
  getCentros,
  createCentro,
  deleteCentro,
  updateCentro,
} from "../services/centroService";
import api from "../services/api";

export const Centros = () => {
  const [centros, setCentros] = useState([]);
  const [ayuntamientos, setAyuntamientos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalLote, setMostrarModalLote] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [centroSeleccionado, setCentroSeleccionado] = useState(null);
  const [loteElegidoId, setLoteElegidoId] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    localidad: "",
    idAyuntamiento: "",
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const dataCentros = await getCentros();
      const responseAytos = await api.get("/Ayuntamientos");
      const dataAytos = responseAytos.data;

      try {
        const responseLotes = await api.get("/Lotes");
        setLotes(responseLotes.data || []);
      } catch (errLotes) {
        console.error("Error al precargar los lotes:", errLotes);
      }

      if (dataCentros && Array.isArray(dataCentros)) {
        setCentros(dataCentros);
      } else if (
        dataCentros &&
        dataCentros.data &&
        Array.isArray(dataCentros.data)
      ) {
        setCentros(dataCentros.data);
      }

      if (dataAytos && Array.isArray(dataAytos)) {
        setAyuntamientos(dataAytos);
      } else if (dataAytos && dataAytos.data && Array.isArray(dataAytos.data)) {
        setAyuntamientos(dataAytos.data);
      }
    } catch (error) {
      console.error("Error al cargar datos en la vista de centros:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleDesasignarLote = async (centroId, loteId) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas desvincular este lote de este centro educativo?",
      )
    ) {
      return;
    }

    try {

      await api.post(
        `/Lotes/desasignar-centro?loteId=${loteId}&centroId=${centroId}`,
      );
      alert("¡Lote retirado de la instalación con éxito!");
      cargarDatos(); 
    } catch (error) {
      console.error("Error al desasignar el lote:", error);
      alert(
        error.response?.data?.mensaje ||
          "Error al procesar la desasignación en el servidor municipal.",
      );
    }
  };

  const prepararEdicion = (centro) => {
    setEditandoId(centro.id);
    setFormData({
      nombre: centro.nombre || "",
      direccion: centro.direccion || "",
      localidad: centro.localidad || "",
      idAyuntamiento: centro.idAyuntamiento
        ? centro.idAyuntamiento.toString()
        : "",
    });
    setMostrarModal(true);
  };

  const prepararAsignacionLote = (centro) => {
    setCentroSeleccionado(centro);
    setLoteElegidoId("");
    setMostrarModalLote(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditandoId(null);
    setFormData({
      nombre: "",
      direccion: "",
      localidad: "",
      idAyuntamiento: "",
    });
  };

  const cerrarModalLote = () => {
    setMostrarModalLote(false);
    setCentroSeleccionado(null);
    setLoteElegidoId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const centroParaEnviar = {
        id: editandoId || 0,
        nombre: formData.nombre,
        direccion: formData.direccion,
        localidad: formData.localidad,
        idAyuntamiento: parseInt(formData.idAyuntamiento),
      };

      if (editandoId) {
        await updateCentro(editandoId, centroParaEnviar);
      } else {
        await createCentro(centroParaEnviar);
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error("Error al procesar:", error);
      alert("Error al guardar los cambios.");
    }
  };

  const handleAsignarLoteSubmit = async (e) => {
    e.preventDefault();
    if (!loteElegidoId) {
      alert("Por favor, selecciona un lote válido.");
      return;
    }

    try {
      await api.post(
        `/Lotes/asignar-centro?loteId=${parseInt(loteElegidoId)}&centroId=${centroSeleccionado.id}`,
      );
      alert(`¡Instalación vinculada con éxito al Lote seleccionado!`);
      cerrarModalLote();
      cargarDatos();
    } catch (error) {
      console.error("Error al asociar lote y centro:", error);
      alert(
        error.response?.data?.mensaje || "Error al procesar la vinculación.",
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este centro?")) {
      try {
        await deleteCentro(id);
        cargarDatos();
      } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el centro.");
      }
    }
  };

  return (
    <div className="vista-page-container">
      <Sidebar />

      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Gestión de Centros</h1>
          <p>
            Administra las sedes y edificios vinculados a cada ayuntamiento.
          </p>
        </div>

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
                fontWeight: "600",
                color: "#0f172a",
              }}
            >
              Listado de Centros operativos
            </h2>
            <button
              className="btn-vesta primario"
              onClick={() => setMostrarModal(true)}
            >
              + Nuevo Centro
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", padding: "10px 0" }}>
              Sincronizando con bases operativas...
            </p>
          ) : centros.length === 0 ? (
            <p
              style={{
                color: "#64748b",
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              No se han encontrado registros de centros operativos.
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Nombre del Centro</th>
                  <th>Dirección</th>
                  <th>Localidad</th>
                  <th>Ayuntamiento Asignado</th>
                  <th>Lotes Asignados</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {centros.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: "#1e293b" }}>{c.nombre}</strong>
                    </td>
                    <td style={{ color: "#475569" }}>
                      {c.direccion || "Sede Central"}
                    </td>
                    <td style={{ color: "#475569" }}>{c.localidad || "---"}</td>
                    <td>
                      <span
                        className="badge-institucional"
                        style={{
                          backgroundColor: "#e0f2fe",
                          color: "#0369a1",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {ayuntamientos.find((a) => a.id === c.idAyuntamiento)
                          ?.nombreMunicipio ||
                          ayuntamientos.find((a) => a.id === c.idAyuntamiento)
                            ?.nombre ||
                          "N/A"}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {c.lotes && c.lotes.length > 0 ? (
                          c.lotes.map((lote) => (
                            <span
                              key={lote.id}
                              style={{
                                backgroundColor: "#f0fdf4",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {lote.nombre}
                              <button
                                type="button"
                                onClick={() =>
                                  handleDesasignarLote(c.id, lote.id)
                                }
                                style={{
                                  border: "none",
                                  background: "#e2f8e9",
                                  color: "#166534",
                                  cursor: "pointer",
                                  fontSize: "9px",
                                  fontWeight: "bold",
                                  width: "14px",
                                  height: "14px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 0,
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#fee2e2";
                                  e.target.style.color = "#b91c1c";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#e2f8e9";
                                  e.target.style.color = "#166534";
                                }}
                              >                               
                              </button>
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                              fontStyle: "italic",
                            }}
                          >
                            Sin lote asignado
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-vesta"
                        style={{
                          marginRight: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          backgroundColor: "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                        onClick={() => prepararAsignacionLote(c)}
                      >
                        Asignar Lote
                      </button>
                      <button
                        className="btn-vesta secundario"
                        style={{
                          marginRight: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                        }}
                        onClick={() => prepararEdicion(c)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-vesta peligro"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Eliminar
                      </button>
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
            <h2 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
              {editandoId ? "Modificar Instalación" : "Registrar Nueva Sede"}
            </h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <div>
                <label style={labelStyle}>Nombre del Centro</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  style={inputStyle}
                  placeholder="Ej: Polideportivo Las Gaunas"
                />
              </div>
              <div>
                <label style={labelStyle}>Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Ej: Av. Moncalvillo, 2"
                />
              </div>
              <div>
                <label style={labelStyle}>Localidad</label>
                <input
                  type="text"
                  value={formData.localidad}
                  onChange={(e) =>
                    setFormData({ ...formData, localidad: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Ej: Logroño"
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Asignar Ente Regulador (Ayuntamiento)
                </label>
                <select
                  value={formData.idAyuntamiento}
                  onChange={(e) =>
                    setFormData({ ...formData, idAyuntamiento: e.target.value })
                  }
                  required
                  style={selectStyle}
                >
                  <option value="">
                    -- Selecciona la administración responsable --
                  </option>
                  {ayuntamientos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombreMunicipio || a.nombre}
                    </option>
                  ))}
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
                  onClick={cerrarModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-vesta primario">
                  {editandoId ? "Guardar Cambios" : "Dar de Alta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalLote && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2
              style={{
                margin: "0 0 5px 0",
                color: "#0f172a",
                fontSize: "20px",
              }}
            >
              Vincular Bloque de Licitación
            </h2>
            <p
              style={{
                margin: "0 0 20px 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Asigna la instalación{" "}
              <strong>{centroSeleccionado?.nombre}</strong> a un lote regulado
              activo.
            </p>
            <form
              onSubmit={handleAsignarLoteSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label style={labelStyle}>Seleccionar Lote de Destino</label>
                <select
                  value={loteElegidoId}
                  onChange={(e) => setLoteElegidoId(e.target.value)}
                  required
                  style={selectStyle}
                >
                  <option value="">
                    -- Elige el lote de contratación pública --
                  </option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre || `Lote Num. ${l.id}`} —{" "}
                      {l.descripcion?.substring(0, 30)}...
                    </option>
                  ))}
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
                  onClick={cerrarModalLote}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="btn-vesta primario"
                  style={{ backgroundColor: "#4f46e5" }}
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "32px",
  borderRadius: "12px",
  width: "100%",
  maxWidth: "480px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
};
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#334155",
};
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
const selectStyle = { ...inputStyle, cursor: "pointer" };
