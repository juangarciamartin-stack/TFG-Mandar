import api from "./api"; //  Nuestra instancia con interceptores automáticos

const API_URL = "/Pliegos";

// Obtener todos los pliegos (GET)
export const getPliegos = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

// Crear/Subir un nuevo pliego con archivo físico (POST)
export const createPliego = async (formData) => {
  // Al pasarle un FormData, Axios configura automáticamente el 'Content-Type': 'multipart/form-data'
  const response = await api.post(`${API_URL}/subir`, formData);
  return response.data;
};

// Eliminar un pliego (DELETE)
export const deletePliego = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};
