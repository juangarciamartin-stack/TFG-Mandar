import axios from "axios";
import { getCurrentUser } from "./authService";
import api from "./api";

const API_URL = api.defaults.baseURL;

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
