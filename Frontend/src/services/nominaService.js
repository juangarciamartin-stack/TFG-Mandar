import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = "http://localhost:5125/api"; //mirar tambien esto que sea de variables de entorno.

export const getNominas = async () => {
  const user = getCurrentUser();

  // Añadimos el token Bearer en los headers para autorizar la petición
  const response = await axios.get(`${API_URL}/Nominas`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
      //añadir la expiracion de tokens
    },
  });

  return response.data;
};
