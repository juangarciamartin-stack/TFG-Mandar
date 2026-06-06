import axios from "axios";

const API_URL = "http://localhost:5125/api/Auth";

// Login con captura de errores y mapeo de DTO corregido
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: email,
      password: password,
    });

    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("rol", response.data.rol);
      localStorage.setItem("usuarioId", response.data.usuarioId);
      localStorage.setItem("nombre", response.data.nombre || "");

      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }

      //  Guardar ID de empresa si el usuario gestiona una
      if (response.data.empresaId) {
        localStorage.setItem("empresaId", response.data.empresaId);
      } else {
        localStorage.removeItem("empresaId");
      }

      //Guardar el ID real del Ayuntamiento si viene en la respuesta
      if (response.data.idAyuntamiento) {
        localStorage.setItem("idAyuntamiento", response.data.idAyuntamiento);
      } else {
        localStorage.removeItem("idAyuntamiento");
      }

      //  Guardar flag de doble vida laboral
      localStorage.setItem(
        "tieneContratoActivo",
        response.data.tieneContratoActivo ? "true" : "false",
      );
    }

    return response.data;
  } catch (error) {
    const mensajeError =
      error.response?.data?.mensaje || "Error al conectar con el servidor";
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
