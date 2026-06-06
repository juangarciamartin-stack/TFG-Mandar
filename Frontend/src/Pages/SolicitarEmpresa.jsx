import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import api from "../services/api"; 

export const SolicitarEmpresa = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    nombreEmpresa: "",
    cif: "",
    direccion: "",
    emailContacto: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const currentUserId = localStorage.getItem("usuarioId");

    if (!currentUserId) {
      setErrorMessage("Tu sesión ha expirado. Por favor, vuelve a loguearte.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        usuarioId: parseInt(currentUserId), 
      };

      const response = await api.post("/Empresas/solicitar", payload);

      setSuccessMessage(
        response.data.mensaje || "¡Solicitud registrada correctamente!",
      );

      setFormData({
        nombreEmpresa: "",
        cif: "",
        direccion: "",
        emailContacto: "",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.mensaje ||
        "Error al procesar la solicitud de la contrata.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vista-page-container" style={{ display: "flex" }}>
      <Sidebar />
      <div
        className="vista-contenido-scroll"
        style={{ marginLeft: "260px", padding: "32px", width: "100%" }}
      >
        <div className="view-intro" style={{ marginBottom: "24px" }}>
          <h1
            style={{ color: "#0f172a", fontSize: "28px", margin: "0 0 8px 0" }}
          >
            Registrar y Constituir Empresa
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Inicia los trámites para dar de alta tu entidad como licitadora
            oficial. La solicitud será auditada y aprobada por el Ayuntamiento.
          </p>
        </div>

        <div
          className="modulo-tarjeta-blanca"
          style={{
            backgroundColor: "#fff",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            maxWidth: "600px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              color: "#1e293b",
              marginTop: 0,
              marginBottom: "20px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "10px",
            }}
          >
            Expediente de Registro Comercial
          </h2>

          {successMessage && (
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
              {successMessage}
            </div>
          )}

          {errorMessage && (
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
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "18px" }}
          >
            <div>
              <label style={styles.label}>
                Nombre Comercial / Razón Social
              </label>
              <input
                type="text"
                name="nombreEmpresa"
                value={formData.nombreEmpresa}
                onChange={handleChange}
                placeholder="Ej. Limpiezas Logroño S.L."
                required
                style={styles.input}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={styles.label}>C.I.F. Institucional</label>
                <input
                  type="text"
                  name="cif"
                  value={formData.cif}
                  onChange={handleChange}
                  placeholder="Ej. B26XXXXXX"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>
                  Email Corporativo de Contacto
                </label>
                <input
                  type="email"
                  name="emailContacto"
                  value={formData.emailContacto}
                  onChange={handleChange}
                  placeholder="contacto@tuempresa.com"
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>
                Dirección Fiscal / Sede Central
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej. Av. de Burgos, 45, Bajo"
                required
                style={styles.input}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-vesta secundario"
                style={{
                  ...styles.button,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                }}
              >
                Descartar Tramitación
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-vesta primario"
                style={{
                  ...styles.button,
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                }}
              >
                {loading
                  ? "Registrando en Sede..."
                  : "Enviar Solicitud de Apertura"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    padding: "11px 20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
};
