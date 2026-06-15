import axios from "axios";


const API_URL = `${import.meta.env.VITE_API_URL}`;

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: email,
      password: password,
    });

    const data = response.data;
    const token = data.token || data.Token;
    const rol = data.rol || data.Rol;
    const usuarioId = data.usuarioId || data.UsuarioId;

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("rol", rol);
      localStorage.setItem("usuarioId", usuarioId);
      localStorage.setItem("nombre", data.nombre || "");

      if (data.idAyuntamiento) {
        localStorage.setItem("idAyuntamiento", data.idAyuntamiento);
      } else {
        localStorage.removeItem("idAyuntamiento");
      }
    }

    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.mensaje || "Email o contraseña incorrectos.";
    console.error("Error en login:", mensajeError);
    throw new Error(mensajeError);
  }
};

// Borrar todo el rastro al salir
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("rol");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("nombre");
  localStorage.removeItem("empresaId");
  localStorage.removeItem("idAyuntamiento"); //  Limpiamos el ID del ayuntamiento al salir
  localStorage.removeItem("tieneContratoActivo");
};

// Recuperar usuario actualizado
export const getCurrentUser = () => {
  return {
    token: localStorage.getItem("token"),
    refreshToken: localStorage.getItem("refreshToken"),
    rol: localStorage.getItem("rol"),
    id: localStorage.getItem("usuarioId"),
    nombre: localStorage.getItem("nombre"),
    empresaId: localStorage.getItem("empresaId"),
    idAyuntamiento: localStorage.getItem("idAyuntamiento"), // Añadido al helper de usuario actual
    tieneContratoActivo: localStorage.getItem("tieneContratoActivo") === "true",
  };
};

// Refrescar el token (se usará en el middleware)
export const refrescarTokenService = async () => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!token || !refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/refresh`, {
      Token: token,
      RefreshToken: refreshToken,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      return response.data.token;
    }
  } catch {
    console.error("El Refresh Token también ha caducado. Forzando logout.");
    logout();
    window.location.href = "/login";
  }
  return null;
};
