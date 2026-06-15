import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = `${import.meta.env.VITE_API_URL}/Centros`;

export const getCentros = async () => {
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
