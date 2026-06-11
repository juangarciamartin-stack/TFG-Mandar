import api from "./api";

export const getEmpresas = async (ayuntamientoId = null) => {

  const url = ayuntamientoId 
    ? `/Empresas?ayuntamientoId=${ayuntamientoId}` 
    : '/Empresas';
    
  const response = await api.get(url); 
  return response.data;
};

export const updateEmpresa = async (id, formData) => {
  const response = await api.put(`/Empresas/${id}`, formData);
  return response.data;
};

export const deleteEmpresa = async (id) => {
  const response = await api.delete(`/Empresas/${id}`);
  return response.data;
};


export const solicitarCreacionEmpresa = async (formData) => {
  const response = await api.post("/Empresas/solicitar", formData);
  return response.data;
};


export const getEmpresasPendientes = async (ayuntamientoId) => {
  let url = "/Empresas/pendientes";
  
  if (ayuntamientoId !== null && ayuntamientoId !== undefined && ayuntamientoId !== "" && ayuntamientoId !== "null") {
    url += `?ayuntamientoId=${ayuntamientoId}`;
  }
    
  console.log(` [Axios] Realizando petición HTTP GET a: ${url}`);
  const response = await api.get(url);
  return response.data;
};


export const cambiarEstadoEmpresa = async (empresaId, estado) => {
  const response = await api.put(`/Empresas/${empresaId}/cambiar-estado`, {
    Estado: estado,
  });
  return response.data;
};


export const postularseAEmpresa = async (formDataObjeto) => {
  const response = await api.post("/Empresas/postularse", formDataObjeto, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const createEmpresa = solicitarCreacionEmpresa;