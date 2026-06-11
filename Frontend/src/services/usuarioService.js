import api from "./api";
export const getVinculaciones = async () => {
  const response = await api.get("/Usuarios/vinculaciones-personal");
  return response.data;
};

export const getUsuariosLista = async () => {
  const response = await api.get("/Usuarios/lista-simples");
  return response.data;
};

export const registrarVinculacion = async (payload) => {
  const response = await api.post("/Usuarios/vincular-empresa", payload);
  return response.data;
};

export const getMisEmpresasSelector = async () => {
  const response = await api.get("/Usuarios/mis-empresas-selector");
  return response.data;
};

export const getTrabajadoresEmpresa = async (empresaId) => {
  const response = await api.get(`/Usuarios/empresa/${empresaId}/trabajadores`);
  return response.data;
};

export const getPosiblesTrabajadores = async (empresaId) => {
  const response = await api.get(
    `/Usuarios/empresa/${empresaId}/posibles-trabajadores`,
  );
  return response.data;
};

export const contratarPersonalBolsa = async (relacionId, tipoRelacion) => {
  const response = await api.put(`/Usuarios/contratar-personal/${relacionId}`, {
    TipoRelacion: tipoRelacion,
  });
  return response.data;
};
