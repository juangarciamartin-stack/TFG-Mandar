import axios from "axios";
import { getCurrentUser } from "./authService";

const getUrl = (path = "") => `${import.meta.env.VITE_API_URL}/Incidencias${path}`;

export const getIncidencias = async () => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl(), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getIncidenciasPorEmpresa = async (empresaId) => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl(`/empresa/${empresaId}`), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getMisContratasTrabajador = async () => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl("/mis-contratas-trabajador"), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const createIncidencia = async (incidenciaData) => {
  const user = getCurrentUser();
  const response = await axios.post(getUrl(), incidenciaData, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const updateIncidencia = async (id, incidenciaData) => {
  const user = getCurrentUser();
  const response = await axios.put(getUrl(`/${id}`), incidenciaData, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};