import api from "./api";

/**
 * Obtiene el listado completo de todas las empresas aceptadas/activas en el sistema
 */
// En tu empresaService.js:
export const getEmpresas = async (ayuntamientoId = null) => {
  // Si viene el ID, la URL será: /api/Empresas?ayuntamientoId=3
  // Si no viene, será simplemente: /api/Empresas (y el backend traerá todas)
  const url = ayuntamientoId 
    ? `/Empresas?ayuntamientoId=${ayuntamientoId}` 
    : '/Empresas';
    
  const response = await api.get(url); // 'api' es tu instancia de axios
  return response.data;
};
/**
 * Modifica o actualiza los datos de una empresa existente
 */
export const updateEmpresa = async (id, formData) => {
  const response = await api.put(`/Empresas/${id}`, formData);
  return response.data;
};

/**
 * Elimina una empresa del sistema por su ID
 */
export const deleteEmpresa = async (id) => {
  const response = await api.delete(`/Empresas/${id}`);
  return response.data;
};

/**
 * Envía una solicitud de creación de nueva empresa al Ayuntamiento
 */
export const solicitarCreacionEmpresa = async (formData) => {
  const response = await api.post("/Empresas/solicitar", formData);
  return response.data;
};

/**
 * Obtiene el listado de empresas pendientes de validación
 * CORRECCIÓN: Validamos de forma estricta que ayuntamientoId exista, no sea null, ni string vacío
 */
export const getEmpresasPendientes = async (ayuntamientoId) => {
  let url = "/Empresas/pendientes";
  
  // Forzamos un control estricto: que tenga valor real y que no sea la palabra "null" en string
  if (ayuntamientoId !== null && ayuntamientoId !== undefined && ayuntamientoId !== "" && ayuntamientoId !== "null") {
    url += `?ayuntamientoId=${ayuntamientoId}`;
  }
    
  console.log(` [Axios] Realizando petición HTTP GET a: ${url}`);
  const response = await api.get(url);
  return response.data;
};

/**
 * Aprueba o rechaza una empresa (Para el Ayuntamiento)
 */
export const cambiarEstadoEmpresa = async (empresaId, estado) => {
  const response = await api.put(`/Empresas/${empresaId}/cambiar-estado`, {
    Estado: estado,
  });
  return response.data;
};

/**
 * Registra la postulación real de un trabajador enviando el archivo binario (FormData)
 */
export const postularseAEmpresa = async (formDataObjeto) => {
  const response = await api.post("/Empresas/postularse", formDataObjeto, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// ALIAS DE COMPATIBILIDAD
export const createEmpresa = solicitarCreacionEmpresa;