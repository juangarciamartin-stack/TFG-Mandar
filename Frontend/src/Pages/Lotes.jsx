import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar";
import {
  getLotes,
  deleteLote,
  createLote,
  updateLote,
} from "../services/loteService";
import { createPliego, deletePliego } from "../services/pliegoService";
import api from "../services/api";

export const Lotes = () => {
  const [lotes, setLotes] = useState([]);
  const [ayuntamientos, setAyuntamientos] = useState([]);
  const [empresasActivas, setEmpresasActivas] = useState([]);
  const [ayuntamientoSeleccionado, setAyuntamientoSeleccionado] = useState("");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(""); 
  const [loading, setLoading] = useState(true);

  const [mostrarModalLote, setMostrarModalLote] = useState(false);
  const [mostrarModalPliego, setMostrarModalPliego] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);

  const miRol = localStorage.getItem("rol");

  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
  });
  const [loteParaPliego, setLoteParaPliego] = useState(null);
  const [archivoPDF, setArchivoPDF] = useState(null);

  useEffect(() => {
    if (miRol === "Admin" || miRol === "Ayuntamiento") {
      cargarLotes();
      cargarEmpresasActivas(); 
      if (miRol === "Admin" && ayuntamientos.length === 0) cargarAyuntamientos();
    } else {
      setLoading(false);
    }
  }, [miRol, ayuntamientoSeleccionado]); 

  const cargarLotes = async () => {
    try {
      const data = await getLotes();
      setLotes(Array.isArray(data) ? data : []);
    } catch {
      alert("Error al cargar los lotes municipales.");
    } finally {
      setLoading(false);
    }
  };

  const cargarAyuntamientos = async () => {
    try {
      const response = await api.get("/Ayuntamientos");
      setAyuntamientos(response.data);
      if (response.data.length > 0)
        setAyuntamientoSeleccionado(response.data[0].id.toString());
    } catch (error) {
      console.error("No se pudieron cargar los ayuntamientos:", error);
    }
  };

  const cargarEmpresasActivas = async () => {
    try {
      let idAytoFiltrar = "";
      if (miRol === "Admin") {
        idAytoFiltrar = ayuntamientoSeleccionado;
      } else if (miRol === "Ayuntamiento") {
        idAytoFiltrar = localStorage.getItem("idAyuntamiento");
      }

      let url = "/Empresas/lista-desplegable";
      if (idAytoFiltrar) {
        url = `/Empresas/lista-desplegable?ayuntamientoId=${idAytoFiltrar}`;
      }

      const response = await api.get(url);
      setEmpresasActivas(response.data);
    } catch (error) {
      console.error("Error al recuperar las empresas del sistema:", error);
    }
  };

  const handleBorrarPdf = async (idPliego) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente este archivo PDF?")) {
      try {
        await deletePliego(idPliego);
        alert("Archivo PDF retirado con éxito.");
        cargarLotes(); 
      } catch (error) {
        console.error(error);
        alert("No se pudo eliminar el archivo PDF.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente este lote de contratación?")) {
      try {
        await deleteLote(id);
        alert("El lote se ha eliminado correctamente.");
        cargarLotes(); 
      } catch (error) {
        console.error("Error detectado al intentar borrar el lote:", error);
        alert("No se pudo eliminar el lote. Asegúrate de que no tenga centros vinculados que dependan de él.");
      }
    }
  };

  const abrirModalLote = (lote = null) => {
    if (lote) {
      setFormData({
        id: lote.id,
        nombre: lote.nombre || "",
        descripcion: lote.descripcion || "",
      });
      setAyuntamientoSeleccionado(miRol === "Ayuntamiento" ? localStorage.getItem("idAyuntamiento") : (lote.idAyuntamiento?.toString() || ""));
      setEmpresaSeleccionada(lote.idEmpresa?.toString() || ""); 
      setEsEdicion(true);
    } else {
      setFormData({ id: "", nombre: "", descripcion: "" });
      setEmpresaSeleccionada(""); 
      if (miRol === "Ayuntamiento") {
        setAyuntamientoSeleccionado(localStorage.getItem("idAyuntamiento") || ""); 
      } else if (ayuntamientos.length > 0) {
        setAyuntamientoSeleccionado(ayuntamientos[0].id.toString());
      }
      setEsEdicion(false);
    }
    setMostrarModalLote(true);
  };

  const handleSubmitLote = async (e) => {
    e.preventDefault();
    try {
      let miAyuntamientoId = "";

      if (miRol === "Admin") {
        miAyuntamientoId = ayuntamientoSeleccionado;
      } else if (miRol === "Ayuntamiento") {
        miAyuntamientoId = localStorage.getItem("idAyuntamiento");
        
        if (!miAyuntamientoId) {
          alert("Error crítico: No se encuentra el ID de tu Ayuntamiento en la sesión. Por favor, cierra sesión y vuelve a entrar.");
          return;
        }
      }

      const datosFinales = {
        Nombre: formData.nombre,
        Descripcion: formData.descripcion,
        IdAyuntamiento: parseInt(miAyuntamientoId),
        IdEmpresa: empresaSeleccionada ? parseInt(empresaSeleccionada) : null, 
        Centros: [],
        Pliegos: [],
      };

      console.log("Datos que se van a mandar a la API:", datosFinales);

      if (esEdicion) {
        await updateLote(formData.id, {
          Id: parseInt(formData.id),
          ...datosFinales,
        });
      } else {
        await createLote(datosFinales);
      }

      setMostrarModalLote(false);
      cargarLotes();
    } catch (error) {
      console.error("ERROR AL ENVIAR:", error.response?.data || error);
      alert("Error al guardar el lote.");
    }
  };

  const abrirModalPliego = (lote) => {
    setLoteParaPliego(lote);
    setArchivoPDF(null);
    setMostrarModalPliego(true);
  };

  const handleSubmitPliego = async (e) => {
    e.preventDefault();
    if (!archivoPDF) {
      alert("Por favor, selecciona un documento PDF válido.");
      return;
    }

    try {
      const dataToSend = new FormData();
      dataToSend.append("idLote", parseInt(loteParaPliego.id));
      dataToSend.append("archivo", archivoPDF);

      await createPliego(dataToSend);
      alert("¡Pliego técnico guardado y vinculado correctamente!");
      setMostrarModalPliego(false);
      cargarLotes();
    } catch (error) {
      console.error(error);
      alert("Error al subir el pliego técnico al servidor.");
    }
  };

  if (miRol !== "Admin" && miRol !== "Ayuntamiento") {
    return (
      <div className="vista-page-container">
        <Sidebar />
        <div className="vista-contenido-scroll">
          <h1>Acceso Restringido</h1>
        </div>
      </div>
    );
  }

  const modalOverlayStyle = {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  };
  const modalContentStyle = {
    backgroundColor: "#fff", padding: "32px", borderRadius: "12px",
    width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  };
  const labelStyle = { display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13px", color: "#334155" };
  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box", backgroundColor: "#f8fafc", color: "#334155", outline: "none" };

  return (
    <div className="vista-page-container">
      <Sidebar />
      <div className="vista-contenido-scroll">
        <div className="view-intro">
          <h1>Lotes de Contratación Pública</h1>
          <p>Gestión de bloques de licitación y presupuestos asignados por el municipio.</p>
        </div>

        <div className="modulo-tarjeta-blanca">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "600" }}>Lotes Registrados</h2>
            <button className="btn-vesta primario" onClick={() => abrirModalLote()}>+ Nuevo Lote</button>
          </div>

          ={loading ? (
            <p>Cargando lotes...</p>
          ) : lotes.length === 0 ? (
            <p style={{ color: "#64748b" }}>No hay lotes creados.</p>
          ) : (
            <table className="tabla-vesta">
              <thead>
                <tr>
                  <th>Nombre del Lote</th>
                  <th>Descripción Técnica</th>
                  <th>Ayuntamiento</th>
                  <th>Centros Asignados</th>
                  <th>Empresa Adjudicada</th> 
                  <th>Documentos Pliegos (PDF)</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => (
                  <tr key={lote.id}>
                    <td><strong>{lote.nombre}</strong></td>
                    <td>{lote.descripcion || "Sin descripción"}</td>
                    <td>
                      <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "13px" }}>
                        {lote.ayuntamiento?.nombreMunicipio || "No asignado"}
                      </span>
                    </td>
                    
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {lote.centros && lote.centros.length > 0 ? (
                          lote.centros.map((centro) => (
                            <span 
                              key={centro.id || centro.Id} 
                              style={{ backgroundColor: "#f3e8ff", color: "#6b21a8", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500", width: "fit-content" }}
                              title={`${centro.direccion || centro.Direccion} (${centro.localidad || centro.Localidad})`}
                            >
                               {centro.nombre || centro.Nombre}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>Sin centros</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {lote.empresa ? (
                        <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                           {lote.empresa.nombreEmpresa}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic" }}>Sin adjudicar</span>
                      )}
                    </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {lote.pliegos && lote.pliegos.length > 0 ? (
                            lote.pliegos.map((pliego) => (
                              <div key={pliego.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <a 
                                  href={`${api.defaults.baseURL.replace('/api', '')}${pliego.rutaURL}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: "500" }}
                                >
                                  {pliego.nombreArchivo}
                                </a>
                                <span onClick={() => handleBorrarPdf(pliego.id)} style={{ color: "#ef4444", fontSize: "11px", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }} title="Borrar este archivo adjunto">(Eliminar)</span>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>Sin documentos adjuntos</span>
                          )}
                          <button className="btn-vesta" style={{ padding: "4px 8px", fontSize: "11px", alignSelf: "flex-start", backgroundColor: "#f0fdf4", color: "#166534", border: "1px dashed #bbf7d0", borderRadius: "6px", marginTop: "4px", cursor: "pointer" }} onClick={() => abrirModalPliego(lote)}>+ Adjuntar PDF</button>
                        </div>
                      </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn-vesta secundario" style={{ marginRight: "8px", padding: "6px 12px" }} onClick={() => abrirModalLote(lote)}>Editar</button>
                      <button className="btn-vesta peligro" style={{ padding: "6px 12px" }} onClick={() => handleDelete(lote.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarModalLote && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>{esEdicion ? "Modificar Lote" : "Crear Lote Público"}</h2>
            <form onSubmit={handleSubmitLote} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              {miRol === "Admin" && (
                <div>
                  <label style={labelStyle}>Asignar a Ayuntamiento</label>
                  <select value={ayuntamientoSeleccionado} onChange={(e) => setAyuntamientoSeleccionado(e.target.value)} required style={inputStyle}>
                    {ayuntamientos.map((a) => (
                      <option key={a.id || a.Id} value={a.id || a.Id}>{a.nombreMunicipio || a.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Empresa Adjudicataria Contractual</label>
                <select value={empresaSeleccionada} onChange={(e) => setEmpresaSeleccionada(e.target.value)} style={inputStyle}>
                  <option value="">-- Dejar Lote sin Adjudicar / Pendiente --</option>
                  {empresasActivas.map((emp) => (
                    <option key={emp.id || emp.Id} value={emp.id || emp.Id}>
                      {emp.nombreEmpresa || emp.NombreEmpresa || emp.nombre || emp.Nombre} {emp.cif || emp.Cif ? `(CIF: ${emp.cif || emp.Cif})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Nombre del Lote</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descripción Técnica</label>
                <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-vesta secundario" onClick={() => setMostrarModalLote(false)}>Cancelar</button>
                <button type="submit" className="btn-vesta primario">Guardar Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPliego && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Subir Pliego de Condiciones</h3>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Asociando archivo técnico a: <strong>{loteParaPliego?.nombre}</strong></p>

            <form onSubmit={handleSubmitPliego} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <div>
                <label style={labelStyle}>Seleccionar Fichero (Solo formato PDF)</label>
                <input type="file" accept=".pdf" required onChange={(e) => setArchivoPDF(e.target.files[0])} style={{ ...inputStyle, padding: "8px" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="btn-vesta secundario" onClick={() => setMostrarModalPliego(false)}>Cancelar</button>
                <button type="submit" className="btn-vesta primario" style={{ backgroundColor: "#16a34a" }}>Subir Documento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};