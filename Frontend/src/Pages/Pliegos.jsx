import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  getPliegos,
  createPliego,
  deletePliego,
} from "../services/pliegoService";
import { getLotes } from "../services/loteService";
import api from "../services/api";

export const Pliegos = () => {
  const [pliegos, setPliegos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [loteId, setLoteId] = useState("");
  const [archivoPDF, setArchivoPDF] = useState(null);
  const miRol = localStorage.getItem("rol");

  useEffect(() => {
    if (miRol === "Admin" || miRol === "Ayuntamiento") {
      cargarDatos();
    } else {
      setLoading(false);
    }
  }, [miRol]);

  const cargarDatos = async () => {
    try {
      const [dataPliegos, dataLotes] = await Promise.all([
        getPliegos(),
        getLotes(),
      ]);
      setPliegos(Array.isArray(dataPliegos) ? dataPliegos : []);
      setLotes(Array.isArray(dataLotes) ? dataLotes : []);
      if (dataLotes.length > 0) {
        setLoteId(dataLotes[0].id.toString());
      }
    } catch {
      alert("Error al sincronizar la documentación de pliegos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("¿Seguro que deseas retirar este pliego de condiciones?")
    ) {
      try {
        await deletePliego(id);
        setPliegos(pliegos.filter((p) => p.id !== id));
      } catch {
        alert("Error al eliminar el pliego.");
      }
    }
  };

  const abrirModal = () => {
    setArchivoPDF(null);
    if (lotes.length > 0) setLoteId(lotes[0].id.toString());
    setMostrarModal(true);
  };

  const handleFileChange = (e) => {
    setArchivoPDF(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivoPDF) {
      alert("Por favor, selecciona un archivo PDF.");
      return;
    }

    try {

      const dataToSend = new FormData();
      dataToSend.append("idLote", parseInt(loteId));
      dataToSend.append("archivo", archivoPDF);

      await createPliego(dataToSend);
      setMostrarModal(false);
      cargarDatos();
    } catch {
      alert("Error al subir el pliego técnico al servidor.");
    }
  };

  if (miRol !== "Admin" && miRol !== "Ayuntamiento") {
    return (
      <div className="vista-page-container">
        <Sidebar />
        <div className="vista-contenido-scroll">
          <div className="view-intro">
            <h1>Acceso Denegado</h1>
            <p style={{ color: "#ef4444" }}>
              No dispone de los privilegios necesarios.
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="vista-page-container">
      <Sidebar />
      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Pliegos de Cláusulas Técnicas</h1>
          <p>
            Vinculación de normativas específicas y requerimientos
            administrativos a los lotes vigentes.
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
                color: "#0f172a",
                fontWeight: "600",
              }}
            >
              Documentos Adjuntos
            </h2>
            <button className="btn-vesta primario" onClick={abrirModal}>
              + Subir Pliego
            </button>
          </div>

          {loading ? (
            <p>Cargando pliegos...</p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Nombre del Archivo</th>
                  <th>Fecha de Publicación</th>
                  <th>Lote Destino</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pliegos.map((pliego) => {
                  const loteAsociado = lotes.find(
                    (l) => l.id === pliego.idLote,
                  );
                  return (
                    <tr key={pliego.id}>
                      <td>
                        <a
                          href={`${api.defaults.baseURL.replace('/api', '')}${pliego.rutaURL}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#2563eb",
                            fontWeight: "600",
                            textDecoration: "none",
                          }}
                        >
                          {pliego.nombreArchivo}
                        </a>
                      </td>
                      <td style={{ color: "#64748b" }}>
                        {new Date(pliego.fechaSubida).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {loteAsociado
                            ? loteAsociado.nombre
                            : `ID Lote: ${pliego.idLote}`}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-vesta peligro"
                          style={{ padding: "6px 12px" }}
                          onClick={() => handleDelete(pliego.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Subir Pliego Técnico (PDF)</h2>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginTop: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>Asociar a Lote Regulado</label>
                <select
                  value={loteId}
                  onChange={(e) => setLoteId(e.target.value)}
                  required
                  style={inputStyle}
                >
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Documento Legal (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
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
                  Subir y Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
