import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = `${import.meta.env.VITE_API_URL}/Pliegos`;

export const getPliegos = async () => {
  const user = getCurrentUser();
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const createPliego = async (formData) => {
  const user = getCurrentUser();
  const response = await axios.post(`${API_URL}/subir`, formData, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const deletePliego = async (id) => {
  const user = getCurrentUser();
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};