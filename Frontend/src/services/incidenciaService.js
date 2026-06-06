import api from "./api";

export const getIncidencias = async () => {
  const response = await api.get("/Incidencias");
  return response.data;
};

//  Traer incidencias filtradas por empresa (Uso del selector superior del CEO)
export const getIncidenciasPorEmpresa = async (empresaId) => {
  const response = await api.get(`/Incidencias/empresa/${empresaId}`);
  return response.data;
};

// Traer contratas del operario para rellenar el modal select
export const getMisContratasTrabajador = async () => {
  const response = await api.get("/Incidencias/mis-contratas-trabajador");
  return response.data;
};

export const createIncidencia = async (incidenciaData) => {
  const response = await api.post("/Incidencias", incidenciaData);
  return response.data;
};

export const updateIncidencia = async (id, incidenciaData) => {
  const response = await api.put(`/Incidencias/${id}`, incidenciaData);
  return response.data;
};
