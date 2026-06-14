import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../Components/Sidebar";
import api from "../services/api"; 

const styles = {
  th: { padding: "14px 18px", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  td: { padding: "16px 18px", fontSize: "14px", color: "#334155" },
  actionBtn: { border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "opacity 0.2s" },
};

export const ValidarEmpresas = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [propietariosSeleccionados, setPropietariosSeleccionados] = useState({});


  const cargarUsuarios = useCallback(async () => {
    if (localStorage.getItem("rol") === "Admin") {
      try {
        const response = await api.get("/Usuarios/lista-simples");
        const listaCompleta = Array.isArray(response.data) ? response.data : response.data?.data || [];
        const soloPersonasYEmpresas = listaCompleta.filter((u) => {
          const rolUsuario = (u.Rol || u.rol || "").toLowerCase();
          return rolUsuario !== "admin" && rolUsuario !== "ayuntamiento";
        });
        setUsuariosDisponibles(soloPersonasYEmpresas);
      } catch (err) {
        console.error("Error cargando usuarios asignables:", err);
      }
    }
  }, []);


  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const miRolActual = localStorage.getItem("rol") || "Ayuntamiento";
      const miAyuntamientoId = localStorage.getItem("ayuntamientoId") || 
                               localStorage.getItem("AyuntamientoId") || 
                               localStorage.getItem("idAyuntamiento") ||
                               localStorage.getItem("IdAyuntamiento");

      let empresasAcumuladas = [];

      if (miRolActual === "Admin") {
        
        let idsAyuntamientos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 
        try {
          const resAyto = await api.get("/Ayuntamientos"); 
          const listaAytos = Array.isArray(resAyto.data) ? resAyto.data : resAyto.data?.data || [];
          if (listaAytos.length > 0) {
            idsAyuntamientos = listaAytos.map(a => a.id || a.Id);
          }
        } catch (e) {
          console.warn("No se pudo mapear la lista dinámica de ayuntamientos.");
        }

        const promesas = idsAyuntamientos.map(async (id) => {
          try {
            const res = await api.get(`/Empresas/pendientes?ayuntamientoId=${id}`);
            return Array.isArray(res.data) ? res.data : [];
          } catch (err) {
            return [];
          }
        });

        const resultados = await Promise.all(promesas);
        empresasAcumuladas = resultados.flat(); 

      } 
      else {
        if (!miAyuntamientoId || miAyuntamientoId === "null" || miAyuntamientoId === "undefined") {
          setError("Tu sesión no contiene un identificador de Ayuntamiento válido.");
          setLoading(false);
          return;
        }
        const res = await api.get(`/Empresas/pendientes?ayuntamientoId=${Number(miAyuntamientoId)}`);
        empresasAcumuladas = Array.isArray(res.data) ? res.data : [];
      }

      const registrosUnicos = [];
      const listaIds = new Set();
      empresasAcumuladas.forEach(emp => {
        const idActual = emp.id || emp.Id;
        if (!listaIds.has(idActual)) {
          listaIds.add(idActual);
          registrosUnicos.push(emp);
        }
      });

      setSolicitudes(registrosUnicos);

      const mapaInicial = {};
      registrosUnicos.forEach((sol) => {
        const currentId = sol.id || sol.Id;
        const currentUserId = sol.usuarioId || sol.UsuarioId || "";
        mapaInicial[currentId] = currentUserId;
      });
      setPropietariosSeleccionados(mapaInicial);

    } catch (err) {
      setError("Error al recuperar las empresas pendientes del servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const inicializarComponente = async () => {
      await cargarSolicitudes();
      await cargarUsuarios();
    };
    inicializarComponente();
  }, [cargarSolicitudes, cargarUsuarios]);

  const handleAccion = async (id, nuevoEstado) => {
    try {
      setError("");
      setMensaje("");

      const usuarioAsignadoId = propietariosSeleccionados[id];
      const rolActual = localStorage.getItem("rol");

      if (nuevoEstado === "Aprobado" && rolActual === "Admin" && !usuarioAsignadoId) {
        setError("OPERACIÓN ABORTADA: Debes asignar un usuario titular antes de validar la homologación.");
        return;
      }

      const miAyuntamientoId = parseInt(
        localStorage.getItem("ayuntamientoId") || 
        localStorage.getItem("AyuntamientoId") || 
        localStorage.getItem("idAyuntamiento"), 10
      ) || null;

      const res = await api.put(`/Empresas/${id}/cambiar-estado`, {
        Estado: nuevoEstado,
        RolUsuario: rolActual,
        AyuntamientoId: miAyuntamientoId,
        UsuarioId: usuarioAsignadoId ? parseInt(usuarioAsignadoId, 10) : undefined
      });

      setMensaje(res.data?.mensaje || `Expediente actualizado a '${nuevoEstado}' correctamente.`);
      cargarSolicitudes();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || "Error crítico al actualizar el estado del expediente.");
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
      <div className="vista-contenido-scroll" style={{ marginLeft: "260px", padding: "32px", width: "100%", fontFamily: "system-ui, sans-serif" }}>
        <div className="view-intro" style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#0f172a", fontSize: "28px", margin: "0 0 8px 0" }}>
            Auditoría y Validación de Empresas (Admin Global)
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Panel unificado para la inspección y aprobación legal de contratas de todos los Ayuntamientos.
          </p>
        </div>

        {mensaje && <div style={{ backgroundColor: "#ecfdf5", color: "#047857", padding: "14px", borderRadius: "8px", border: "1px solid #a7f3d0", marginBottom: "20px", fontWeight: "500" }}>{mensaje}</div>}
        {error && <div style={{ backgroundColor: "#fee2e2", color: "#b91c1c", padding: "14px", borderRadius: "8px", border: "1px solid #fca5a5", marginBottom: "20px", fontWeight: "500" }}>{error}</div>}

        {loading ? (
          <p style={{ color: "#64748b", fontSize: "15px" }}>Realizando escaneo unificado en las sedes periféricas...</p>
        ) : solicitudes.length === 0 ? (
          <div style={{ backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", padding: "40px", borderRadius: "12px", textAlign: "center", color: "#64748b" }}>
            No hay expedientes de empresas pendientes de validación en ningún Ayuntamiento actualmente.
          </div>
        ) : (
          <div style={{ overflowX: "auto", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={styles.th}>Razón Social</th>
                  <th style={styles.th}>C.I.F.</th>
                  <th style={styles.th}>Dirección Fiscal</th>
                  <th style={styles.th}>Email Contacto</th>
                  {localStorage.getItem("rol") === "Admin" && <th style={styles.th}>Asignar Titular Legal</th>}
                  <th style={{ ...styles.th, textAlign: "right" }}>Acciones Administrativas</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((sol) => {
                  const currentId = sol.id || sol.Id;
                  return (
                    <tr key={currentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...styles.td, fontWeight: "600", color: "#0f172a" }}>{sol.nombreEmpresa || sol.NombreEmpresa}</td>
                      <td style={styles.td}>
                        <code style={{ backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#0f172a" }}>{sol.cif || sol.Cif}</code>
                      </td>
                      <td style={styles.td}>{sol.direccion || sol.Direccion}</td>
                      <td style={styles.td}>{sol.emailContacto || sol.EmailContacto}</td>

                      {localStorage.getItem("rol") === "Admin" && (
                        <td style={styles.td}>
                          <select
                            value={propietariosSeleccionados[currentId] || ""}
                            onChange={(e) => handleSelectUsuario(currentId, e.target.value)}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px", backgroundColor: "#fff", color: "#334155", maxWidth: "200px" }}
                          >
                            <option value="">-- Cambiar Dueño Cuenta --</option>
                            {usuariosDisponibles.map((u) => (
                              <option key={u.Id || u.id} value={u.Id || u.id}>
                                {u.Nombre || u.nombre || u.Email || u.email} (ID: {u.Id || u.id})
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button onClick={() => handleAccion(currentId, "Rechazado")} style={{ ...styles.actionBtn, backgroundColor: "#fee2e2", color: "#b91c1c", marginRight: "8px" }}>Denegar</button>
                        <button onClick={() => handleAccion(currentId, "Aprobado")} style={{ ...styles.actionBtn, backgroundColor: "#e0e7ff", color: "#4338ca", fontWeight: "700" }}>Aprobar Alta</button>
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