import { getCurrentUser } from "./authService";
import api from "./api";

const ENDPOINT = "/ayuntamientos"; 

export const getAyuntamientos = async () => {
  const user = getCurrentUser();
  const response = await api.get(ENDPOINT, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const createAyuntamiento = async (data) => {
  const user = getCurrentUser();
  const response = await api.post(ENDPOINT, data, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const updateAyuntamiento = async (id, data) => {
  const user = getCurrentUser();
  const response = await api.put(`${ENDPOINT}/${id}`, data, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const deleteAyuntamiento = async (id) => {
  const user = getCurrentUser();
  await api.delete(`${ENDPOINT}/${id}`, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
};