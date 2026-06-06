import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = "http://localhost:5125/api/Ayuntamientos";

export const getAyuntamientos = async () => {
  const user = getCurrentUser();
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  return response.data;
};

export const createAyuntamiento = async (data) => {
  const user = getCurrentUser();
  const response = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  return response.data;
};

export const updateAyuntamiento = async (id, data) => {
  const user = getCurrentUser();
  const response = await axios.put(`${API_URL}/${id}`, data, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  return response.data;
};

export const deleteAyuntamiento = async (id) => {
  const user = getCurrentUser();
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${user.token}` },
  });
};
