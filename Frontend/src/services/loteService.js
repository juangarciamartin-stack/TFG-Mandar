import api from "./api"; //  Nuestra instancia con interceptores automáticos

const API_URL = "/Lotes";

export const getLotes = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const createLote = async (data) => {
  const response = await api.post(API_URL, data);
  return response.data;
};

export const updateLote = async (id, data) => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteLote = async (id) => {
  await api.delete(`${API_URL}/${id}`);
};
