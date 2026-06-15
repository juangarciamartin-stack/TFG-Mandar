import axios from "axios";
import { getCurrentUser } from "./authService";

const getUrl = (path) => `${import.meta.env.VITE_API_URL}/Usuarios${path}`;

export const getVinculaciones = async () => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl("/vinculaciones-personal"), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getUsuariosLista = async () => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl("/lista-simples"), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const registrarVinculacion = async (payload) => {
  const user = getCurrentUser();
  const response = await axios.post(getUrl("/vincular-empresa"), payload, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getMisEmpresasSelector = async () => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl("/mis-empresas-selector"), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getTrabajadoresEmpresa = async (empresaId) => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl(`/empresa/${empresaId}/trabajadores`), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getPosiblesTrabajadores = async (empresaId) => {
  const user = getCurrentUser();
  const response = await axios.get(getUrl(`/empresa/${empresaId}/posibles-trabajadores`), {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const contratarPersonalBolsa = async (relacionId, tipoRelacion) => {
  const user = getCurrentUser();
  const response = await axios.put(getUrl(`/contratar-personal/${relacionId}`), {
    TipoRelacion: tipoRelacion,
  }, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};