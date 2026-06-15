import axios from "axios";
import { getCurrentUser } from "./authService";

const getBaseUrl = () => `${import.meta.env.VITE_API_URL}/Empresas`;

export const getEmpresas = async (ayuntamientoId = null) => {
  const user = getCurrentUser();
  const url = ayuntamientoId 
    ? `${getBaseUrl()}?ayuntamientoId=${ayuntamientoId}` 
    : getBaseUrl();
    
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${user?.token}` },
  }); 
  return response.data;
};

export const updateEmpresa = async (id, formData) => {
  const user = getCurrentUser();
  const response = await axios.put(`${getBaseUrl()}/${id}`, formData, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const deleteEmpresa = async (id) => {
  const user = getCurrentUser();
  const response = await axios.delete(`${getBaseUrl()}/${id}`, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const solicitarCreacionEmpresa = async (formData) => {
  const user = getCurrentUser();
  const response = await axios.post(`${getBaseUrl()}/solicitar`, formData, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const getEmpresasPendientes = async (ayuntamientoId) => {
  const user = getCurrentUser();
  try {
    if (!ayuntamientoId || ayuntamientoId === 0 || ayuntamientoId === "0") {
      const response = await axios.get(getBaseUrl(), {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
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
      const url = `${getBaseUrl()}/pendientes?ayuntamientoId=${ayuntamientoId}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      return response.data;
    }
  } catch (error) {
    console.error(" ERROR:", error);
    return [];
  }
};

export const cambiarEstadoEmpresa = async (empresaId, estado) => {
  const user = getCurrentUser();
  const response = await axios.put(`${getBaseUrl()}/${empresaId}/cambiar-estado`, {
    Estado: estado,
  }, {
    headers: { Authorization: `Bearer ${user?.token}` },
  });
  return response.data;
};

export const postularseAEmpresa = async (formDataObjeto) => {
  const user = getCurrentUser();
  const response = await axios.post(`${getBaseUrl()}/postularse`, formDataObjeto, {
    headers: {
      Authorization: `Bearer ${user?.token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const createEmpresa = solicitarCreacionEmpresa;