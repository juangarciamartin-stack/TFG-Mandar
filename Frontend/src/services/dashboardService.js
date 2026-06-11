import api from "./api";

export const getEstadisticasDashboard = async () => {
  const [resLotes, resIncidencias] = await Promise.all([
    api.get("/Lotes"),
    api.get("/Incidencias"),
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
