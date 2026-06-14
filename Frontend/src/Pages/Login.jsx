import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5125/api/Auth/login', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "Email o contraseña incorrectos.");
      }

      const tokenReal = data.token;
      const usuarioIdReal = data.usuarioId;
      const rolReal = data.rol;
      const idAyuntamientoReal = data.idAyuntamiento;
      const empresaIdReal = data.empresaId;
      const tieneContratoActivoReal = data.tieneContratoActivo;

      localStorage.setItem("token", tokenReal);
      localStorage.setItem("usuarioId", usuarioIdReal);
      localStorage.setItem("rol", rolReal);

      if (idAyuntamientoReal && idAyuntamientoReal !== "null" && idAyuntamientoReal !== "undefined") {
        localStorage.setItem("idAyuntamiento", idAyuntamientoReal);
        localStorage.setItem("ayuntamientoId", idAyuntamientoReal);
        localStorage.setItem("AyuntamientoId", idAyuntamientoReal);
      } else {
        localStorage.removeItem("idAyuntamiento");
        localStorage.removeItem("ayuntamientoId");
        localStorage.removeItem("AyuntamientoId");
      }

      if (empresaIdReal) {
        localStorage.setItem("empresaId", empresaIdReal);
      } else {
        localStorage.removeItem("empresaId");
      }

      localStorage.setItem("tieneContratoActivo", tieneContratoActivoReal ? "true" : "false");

      if (rolReal === "Admin") {
        navigate("/ayuntamientos");
      } else if (rolReal === "Ayuntamiento") {
        navigate("/empresas-pendientes"); 
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ textAlign: "center", color: "#0f172a", marginBottom: "8px" }}>
        Iniciar Sesión
      </h2>
      <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
        Acceso unificado a la plataforma VESTA
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Corporativo / Ciudadano</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="ejemplo@vesta.es"
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Contraseña de Acceso</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Autenticando credenciales..." : "Entrar al Sistema"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          ¿No tienes una cuenta?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{
              color: "#4f46e5",
              fontWeight: "600",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Regístrate aquí
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: "400px", margin: "120px auto", padding: "32px", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", fontFamily: "system-ui, sans-serif", backgroundColor: "#fff" },
  form: { display: "flex", flexDirection: "column", gap: "18px", marginTop: "8px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#334155" },
  input: { padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", backgroundColor: "#f8fafc", color: "#0f172a", outline: "none" },
  button: { padding: "11px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "600", marginTop: "6px" },
  error: { backgroundColor: "#fee2e2", color: "#b91c1c", padding: "12px", borderRadius: "6px", fontSize: "13px", marginBottom: "10px", border: "1px solid #fca5a5", fontWeight: "500" },
};