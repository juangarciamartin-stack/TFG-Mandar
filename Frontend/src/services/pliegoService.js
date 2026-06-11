import api from "./api"; 

const API_URL = "/Pliegos";

export const getPliegos = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const createPliego = async (formData) => {

  const response = await api.post(`${API_URL}/subir`, formData);
  return response.data;
};


export const deletePliego = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};
