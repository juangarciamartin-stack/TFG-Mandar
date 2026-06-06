import api from "./api";

/**
 * Obtiene el listado completo de todas las empresas aceptadas/activas en el sistema
 */
export const getEmpresas = async () => {
  const response = await api.get("/Empresas");
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
 */
export const getEmpresasPendientes = async () => {
  const response = await api.get("/Empresas/pendientes");
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
  // Pasamos el objeto FormData directamente y configuramos el tipo multipart/form-data
  const response = await api.post("/Empresas/postularse", formDataObjeto, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// ALIAS DE COMPATIBILIDAD
export const createEmpresa = solicitarCreacionEmpresa;
