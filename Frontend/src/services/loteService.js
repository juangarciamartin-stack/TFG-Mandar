import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = `${import.meta.env.VITE_API_URL}/Lotes`;

export const getLotes = async () => {
  const user = getCurrentUser();
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const createLote = async (data) => {
  const user = getCurrentUser();
  const response = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const updateLote = async (id, data) => {
  const user = getCurrentUser();
  const response = await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const deleteLote = async (id) => {
  const user = getCurrentUser();
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
};