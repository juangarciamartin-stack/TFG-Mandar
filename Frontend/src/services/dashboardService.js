import axios from "axios";
import { getCurrentUser } from "./authService";

export const getEstadisticasDashboard = async () => {
  const user = getCurrentUser();
  const baseUrl = import.meta.env.VITE_API_URL;

  const config = {
    headers: { Authorization: `Bearer ${user?.token}` },
  };

  const [resLotes, resIncidencias] = await Promise.all([
    axios.get(`${baseUrl}/Lotes`, config),
    axios.get(`${baseUrl}/Incidencias`, config),
  ]);

  const pendientes = resIncidencias.data.filter(
    (i) => i.estado === "Pendiente" || !i.estado,
  ).length;

  return {
    totalLotes: resLotes.data.length,
    incidenciasPendientes: pendientes,
    totalPersonal: 84, 
  };
};