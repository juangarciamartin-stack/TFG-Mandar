import axios from "axios";
import { getCurrentUser } from "./authService";

const API_URL = `${import.meta.env.VITE_API_URL}/Nominas`;

export const getNominas = async () => {
  const user = getCurrentUser();

  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  });

  return response.data;
};