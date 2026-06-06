import api from "./api"; //cogemos el de api

const API_URL = "/Centros"; //la base del URL esta en api

export const getCentros = async () => {
  // El interceptor pondra el Token "Bearer" automaticamente antes de salir
  const response = await api.get(API_URL);
  return response.data;
};

export const createCentro = async (data) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const deleteCentro = async (id) => {
  await api.delete(`${API_URL}/${id}`);
};

export const updateCentro = async (id, data) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};
