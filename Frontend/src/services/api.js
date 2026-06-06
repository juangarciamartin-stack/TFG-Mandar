import axios from "axios";
import { refrescarTokenService } from "./authService";

// React coge automaticamente la ruta del archivo .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// interceptor salida: añade el token automaticamente en cada llamada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// interceptor de entrada (Middleware de errores y Refresh Token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const nuevoToken = await refrescarTokenService();

      if (nuevoToken) {
        originalRequest.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error); //por si entra otro error que no sea un 401 (renovar token) para que lo devuelva a react
  },
);
export default api;
