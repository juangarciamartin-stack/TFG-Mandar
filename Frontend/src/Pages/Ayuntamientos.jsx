import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  getAyuntamientos,
  deleteAyuntamiento,
  createAyuntamiento,
  updateAyuntamiento,
} from "../services/ayuntamientoService";

export const Ayuntamientos = () => {
  const [ayuntamientos, setAyuntamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    cif: "",
    nombreMunicipio: "",
    direccion: "",
  });

  useEffect(() => {
    cargarDatosMunicipales();
  }, []);

  const cargarDatosMunicipales = async () => {
    try {
      const data = await getAyuntamientos();
      if (data) {
        setAyuntamientos(data);
      }
    } catch (error) {
      console.error("Error al cargar ayuntamientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este ayuntamiento?")) {
      try {
        await deleteAyuntamiento(id);
        cargarDatosMunicipales();
      } catch {
        alert("No se pudo eliminar el ayuntamiento.");
      }
    }
  };

  const abrirModal = (ayto = null) => {
    if (ayto) {
      setFormData({
        id: ayto.id,
        cif: ayto.cif || "",
        nombreMunicipio: ayto.nombreMunicipio || "",
        direccion: ayto.direccion || "",
      });
      setEsEdicion(true);
    } else {
      setFormData({ id: "", cif: "", nombreMunicipio: "", direccion: "" });
      setEsEdicion(false);
    }
    setMostrarModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cifFormateado = formData.cif.trim().toUpperCase();

    if (esEdicion) {
      const nifExiste = ayuntamientos.some(
        (ayto) =>
          ayto.cif.trim().toUpperCase() === cifFormateado &&
          ayto.id !== formData.id,
      );

      if (nifExiste) {
        alert(`Ya existe otro registro con ese CIF/NIF: ${cifFormateado}`);
        return;
      }

      try {
        await updateAyuntamiento(formData.id, formData);
        setMostrarModal(false);
        cargarDatosMunicipales();
      } catch {
        alert("Error al actualizar el ayuntamiento");
      }
    } else {
      const nifExiste = ayuntamientos.some(
        (ayto) => ayto.cif.trim().toUpperCase() === cifFormateado,
      );

      if (nifExiste) {
        alert(
          `El CIF/NIF [${cifFormateado}] ya pertenece a un ayuntamiento de alta en el sistema.`,
        );
        return;
      }

      try {
        const { id: _, ...datosParaCrear } = formData;
        await createAyuntamiento(datosParaCrear);
        setMostrarModal(false);
        cargarDatosMunicipales();
      } catch {
        alert("Error al guardar el ayuntamiento");
      }
    }
  };

  return (
    <div className="vista-page-container">
      <Sidebar />

      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Corporaciones Locales</h1>
          <p>
            Configuración de los entes públicos integrados en la red global de
            control VESTA.
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
              Municipios de Alta
            </h2>
            <button className="btn-vesta primario" onClick={() => abrirModal()}>
              + Nuevo Ayuntamiento
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", padding: "10px 0" }}>
              Sincronizando con base de datos...
            </p>
          ) : ayuntamientos.length === 0 ? (
            <p
              style={{
                color: "#64748b",
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              No se han encontrado registros de ayuntamientos en el sistema.
            </p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>CIF / NIF</th>
                  <th>Municipio</th>
                  <th>Dirección Sede</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ayuntamientos.map((ayto) => (
                  <tr key={ayto.id}>
                    <td>
                      <code
                        style={{
                          backgroundColor: "#f1f5f9",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          color: "#0f172a",
                          fontSize: "13px",
                          fontWeight: "600",
                        }}
                      >
                        {ayto.cif}
                      </code>
                    </td>
                    <td>
                      <strong style={{ color: "#1e293b" }}>
                        {ayto.nombreMunicipio}
                      </strong>
                    </td>
                    <td style={{ color: "#475569" }}>
                      {ayto.direccion || "Dirección Municipal s/n"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-vesta secundario"
                        style={{
                          marginRight: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                        }}
                        onClick={() => abrirModal(ayto)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-vesta peligro"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => handleDelete(ayto.id)}
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

      {/* MODAL */}
      {mostrarModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>
              {esEdicion
                ? "Modificar Corporación Local"
                : "Registrar Nuevo Ayuntamiento"}
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
                <label style={labelStyle}>CIF / NIF Institucional</label>
                <input
                  type="text"
                  name="cif"
                  value={formData.cif}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Nombre del Municipio</label>
                <input
                  type="text"
                  name="nombreMunicipio"
                  value={formData.nombreMunicipio}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Dirección de la Sede Principal</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  style={inputStyle}
                />
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
                <button type="submit" className="btn-vesta primario">
                  {esEdicion ? "Guardar Cambios" : "Dar de Alta"}
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
  maxWidth: "500px",
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
