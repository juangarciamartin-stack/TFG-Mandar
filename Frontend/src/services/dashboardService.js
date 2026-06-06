import api from "./api";

// Consultas directas a tus controladores para traer las listas y contar los elementos
export const getEstadisticasDashboard = async () => {
  const [resLotes, resIncidencias] = await Promise.all([
    api.get("/Lotes"),
    api.get("/Incidencias"),
  ]);

  // Contamos cuántas incidencias siguen en estado "Pendiente"
  const pendientes = resIncidencias.data.filter(
    (i) => i.estado === "Pendiente" || !i.estado,
  ).length;

  return {
    totalLotes: resLotes.data.length,
    incidenciasPendientes: pendientes,
    totalPersonal: 84, // Puedes dejar un valor estático o mapear tu endpoint de trabajadores si dispones de él
  };
};
