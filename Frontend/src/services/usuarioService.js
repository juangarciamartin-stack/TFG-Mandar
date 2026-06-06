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

// Trae las empresas de este CEO para llenar el selector/combo
export const getMisEmpresasSelector = async () => {
  const response = await api.get("/Usuarios/mis-empresas-selector");
  return response.data;
};

// Lista Superior: Trabajadores activos en la empresa seleccionada
export const getTrabajadoresEmpresa = async (empresaId) => {
  const response = await api.get(`/Usuarios/empresa/${empresaId}/trabajadores`);
  return response.data;
};

// Lista Inferior: Candidatos en bolsa ("Pendientes") con CV adjunto
export const getPosiblesTrabajadores = async (empresaId) => {
  const response = await api.get(
    `/Usuarios/empresa/${empresaId}/posibles-trabajadores`,
  );
  return response.data;
};

// Botón de Contratar: Mueve un candidato de la Bolsa a la Plantilla
export const contratarPersonalBolsa = async (relacionId, tipoRelacion) => {
  const response = await api.put(`/Usuarios/contratar-personal/${relacionId}`, {
    TipoRelacion: tipoRelacion,
  });
  return response.data;
};
