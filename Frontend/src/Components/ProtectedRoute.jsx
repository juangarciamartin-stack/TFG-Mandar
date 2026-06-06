import React from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  //children el contenido de la etiqueta, y quien tiene permiso
  const currentUser = getCurrentUser(); //verificacion

  // Si no hay token redirige al login
  if (!currentUser.token) {
    return <Navigate to="/login" replace />;
  }

  // Si se especifican roles y el usuario no tiene el rol permitido, redirige al login
  if (allowedRoles && !allowedRoles.includes(currentUser.rol)) {
    return <Navigate to="/login" replace />;
  }

  // Si todo es correcto, muestra el contenido de la ruta
  return children;
};
