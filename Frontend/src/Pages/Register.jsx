import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Register = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const response = await fetch("http://localhost:5125/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre,
          email: email,
          password: password,
          dni: dni, 
          telefono: telefono, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "Error al procesar el registro.");
      }

      setInfoMessage(
        "¡Cuenta creada correctamente! Redirigiéndote al login...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setError(
        err.message || "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2
        style={{ textAlign: "center", color: "#0f172a", marginBottom: "8px" }}
      >
        Crear Cuenta en VESTA
      </h2>
      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#64748b",
          margin: "0 0 20px 0",
        }}
      >
        Regístrate para solicitar el alta en empresas o contratas activas
      </p>

      {error && <div style={styles.error}>{error}</div>}

      {infoMessage ? (
        <div style={styles.successBox}>
          <p style={{ margin: 0, lineHeight: "1.5", fontWeight: "500" }}>
            {infoMessage}
          </p>
        </div>
      ) : (
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={styles.input}
              placeholder="Juan Pérez"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Documento de Identidad (DNI/NIE)</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              maxLength={9}
              style={styles.input}
              placeholder="12345678X"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Número de Teléfono</label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              style={styles.input}
              placeholder="600123456"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email de Acceso</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="juan.perez@ejemplo.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Procesando registro..." : "Registrarme"}
          </button>
        </form>
      )}

      {!infoMessage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            ¿Ya tienes cuenta?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{
                color: "#2563eb",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Inicia sesión
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "60px auto",
    padding: "32px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
    fontFamily: "system-ui, sans-serif",
    backgroundColor: "#fff",
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#334155" },
  input: {
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#f8fafc",
    outline: "none",
  },
  button: {
    padding: "11px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "10px",
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "10px",
    border: "1px solid #fca5a5",
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    color: "#065f46",
    padding: "20px",
    borderRadius: "8px",
    fontSize: "14px",
    border: "1px solid #a7f3d0",
    textAlign: "center",
  },
};
