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
  try {
    if (!ayuntamientoId || ayuntamientoId === 0 || ayuntamientoId === "0") {
     
      const response = await api.get("/Empresas");
      let listado = Array.isArray(response.data) ? response.data : (response.data?.data || []);

      listado.forEach((emp, index) => {
        console.log(`Empresa [${index}] (${emp.nombreEmpresa}): El estado guardado en la BD es "${emp.estadoAprobacion}"`);
      });

      const filtradasParaAdmin = listado.filter(e => {
        const estado = e.estadoAprobacion ?? "";
        const estadoTexto = estado.toString().trim().toLowerCase();
        return estadoTexto === "pendiente" || estadoTexto === "";
      });

      return filtradasParaAdmin;
    } 
    else {
      const url = `/Empresas/pendientes?ayuntamientoId=${ayuntamientoId}`;
      const response = await api.get(url);
      return response.data;
    }
  } catch (error) {
    console.error(" ERROR:", error);
    return [];
  }
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