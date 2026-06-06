import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Components/Sidebar";
import api from "../services/api"; 
import { getEmpresasPendientes } from "../services/empresaService";

export const ValidarEmpresas = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  const [propietariosSeleccionados, setPropietariosSeleccionados] = useState(
    {},
  );

  const miRol = localStorage.getItem("rol") || "Ayuntamiento";

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

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await getEmpresasPendientes();
      setSolicitudes(data);

      const mapaInicial = {};
      data.forEach((sol) => {
        mapaInicial[sol.id || sol.Id] = sol.usuarioId || sol.UsuarioId || "";
      });
      setPropietariosSeleccionados(mapaInicial);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron recuperar las solicitudes de apertura fiscales.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleAccion = async (id, nuevoEstado) => {
    try {
      setError("");
      setMensaje("");

      const usuarioAsignadoId = propietariosSeleccionados[id];

      if (
        nuevoEstado === "Aprobado" &&
        miRol === "Admin" &&
        !usuarioAsignadoId
      ) {
        setError(
          "OPERACIÓN ABORTADA: Debes asignar un usuario titular antes de validar la homologación de la empresa.",
        );
        return;
      }

      const res = await api.put(`/Empresas/${id}/cambiar-estado`, {
        estado: nuevoEstado,
        usuarioId: usuarioAsignadoId ? parseInt(usuarioAsignadoId) : undefined,
      });

      setMensaje(
        res.data?.mensaje ||
          `Expediente comercial actualizado a '${nuevoEstado}' correctamente.`,
      );

      cargarSolicitudes();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.mensaje ||
          "Error crítico al actualizar el estado del expediente comercial.",
      );
    }
  };

  const handleSelectUsuario = (solicitudId, usuarioId) => {
    setPropietariosSeleccionados((prev) => ({
      ...prev,
      [solicitudId]: usuarioId,
    }));
  };

  return (
    <div className="vista-page-container" style={{ display: "flex" }}>
      <Sidebar />
      <div
        className="vista-contenido-scroll"
        style={{
          marginLeft: "260px",
          padding: "32px",
          width: "100%",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div className="view-intro" style={{ marginBottom: "24px" }}>
          <h1
            style={{ color: "#0f172a", fontSize: "28px", margin: "0 0 8px 0" }}
          >
            Auditoría y Validación de Empresas
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Panel de control del personal municipal para la inspection,
            aprobación legal y alta de nuevas contratas en la plataforma VESTA.
          </p>
        </div>

        {mensaje && (
          <div
            style={{
              backgroundColor: "#ecfdf5",
              color: "#047857",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #a7f3d0",
              marginBottom: "20px",
              fontWeight: "500",
            }}
          >
            {mensaje}
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #fca5a5",
              marginBottom: "20px",
              fontWeight: "500",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: "#64748b", fontSize: "15px" }}>
            Consultando registros en la Sede Electrónica...
          </p>
        ) : solicitudes.length === 0 ? (
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              padding: "40px",
              borderRadius: "12px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No hay expedientes de empresas pendientes de validación jurídica en
            este momento.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <th style={styles.th}>Razón Social</th>
                  <th style={styles.th}>C.I.F.</th>
                  <th style={styles.th}>Dirección Fiscal</th>
                  <th style={styles.th}>Email Contacto</th>

                  {miRol === "Admin" && (
                    <th style={styles.th}>Asignar Titular Legal</th>
                  )}

                  <th style={{ ...styles.th, textAlign: "right" }}>
                    Acciones Administrativas
                  </th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((sol) => {
                  const currentId = sol.id || sol.Id;
                  return (
                    <tr
                      key={currentId}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        style={{
                          ...styles.td,
                          fontWeight: "600",
                          color: "#0f172a",
                        }}
                      >
                        {sol.nombreEmpresa || sol.NombreEmpresa}
                      </td>
                      <td style={styles.td}>
                        <code
                          style={{
                            backgroundColor: "#f1f5f9",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            color: "#0f172a",
                          }}
                        >
                          {sol.cif || sol.Cif}
                        </code>
                      </td>
                      <td style={styles.td}>
                        {sol.direccion || sol.Direccion}
                      </td>
                      <td style={styles.td}>
                        {sol.emailContacto || sol.EmailContacto}
                      </td>

                      {miRol === "Admin" && (
                        <td style={styles.td}>
                          <select
                            value={propietariosSeleccionados[currentId] || ""}
                            onChange={(e) =>
                              handleSelectUsuario(currentId, e.target.value)
                            }
                            style={{
                              padding: "6px 10px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              fontSize: "13px",
                              backgroundColor: "#fff",
                              color: "#334155",
                              maxWidth: "200px",
                            }}
                          >
                            <option value="">-- Cambiar Dueño Cuenta --</option>
                            {usuariosDisponibles.map((u) => (
                              <option key={u.Id || u.id} value={u.Id || u.id}>
                                {u.Nombre || u.nombre || u.Email || u.email}{" "}
                                (ID: {u.Id || u.id})
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button
                          onClick={() => handleAccion(currentId, "Rechazado")}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            marginRight: "8px",
                          }}
                        >
                          Denegar
                        </button>
                        <button
                          onClick={() => handleAccion(currentId, "Aprobado")}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: "#e0e7ff",
                            color: "#4338ca",
                            fontWeight: "700",
                          }}
                        >
                          Aprobar Alta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  th: {
    padding: "14px 18px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: { padding: "16px 18px", fontSize: "14px", color: "#334155" },
  actionBtn: {
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "opacity 0.2s",
  },
};
