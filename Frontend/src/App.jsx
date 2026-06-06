import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Login } from "./Pages/Login.jsx";
import { Register } from "./Pages/Register.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import { Nominas } from "./Pages/Nominas.jsx";
import { Empresas } from "./Pages/Empresas.jsx";

import { Ayuntamientos } from "./Pages/Ayuntamientos.jsx";
import { Centros } from "./Pages/Centros.jsx";
import { Incidencias } from "./Pages/Incidencias.jsx";
import { Lotes } from "./Pages/Lotes.jsx";
import { Personal } from "./Pages/Personal.jsx";
import { Pliegos } from "./Pages/Pliegos.jsx";
import { SolicitarEmpresa } from "./Pages/SolicitarEmpresa.jsx";
import { ValidarEmpresas } from "./Pages/ValidarEmpresas.jsx";
import { ProtectedRoute } from "./Components/ProtectedRoute.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/*Panel Principal */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Ayuntamiento", "Empresa", "Trabajador"]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Gestión de Nóminas */}
        <Route
          path="/nominas"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Empresa", "Trabajador"]}>
              <Nominas />
            </ProtectedRoute>
          }
        />

        {/*  Gestión de Empresas */}
        <Route
          path="/empresas"
          element={
            <ProtectedRoute
              allowedRoles={["Admin", "Ayuntamiento", "Trabajador", "Empresa"]}
            >
              <Empresas />
            </ProtectedRoute>
          }
        />

        {/*  Ayuntamientos */}
        <Route
          path="/ayuntamientos"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Ayuntamientos />
            </ProtectedRoute>
          }
        />

        {/*  Centros */}
        <Route
          path="/centros"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Ayuntamiento"]}>
              <Centros />
            </ProtectedRoute>
          }
        />

        {/*  Incidencias */}
        <Route
          path="/incidencias"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Empresa", "Trabajador"]}>
              <Incidencias />
            </ProtectedRoute>
          }
        />

        {/*  Lotes de Contratos */}
        <Route
          path="/lotes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Ayuntamiento"]}>
              <Lotes />
            </ProtectedRoute>
          }
        />

        {/*  Personal */}
        <Route
          path="/personal"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Empresa"]}>
              <Personal />
            </ProtectedRoute>
          }
        />

        {/*  Pliegos */}
        <Route
          path="/pliegos"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Ayuntamiento"]}>
              <Pliegos />
            </ProtectedRoute>
          }
        />

        {/* Solicitar Alta en Empresa */}
        <Route
          path="/solicitar-empresa"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Trabajador", "Empresa"]}>
              <SolicitarEmpresa />
            </ProtectedRoute>
          }
        />

        {/* Validar Empresas Registradas */}
        <Route
          path="/empresas-pendientes"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Ayuntamiento"]}>
              <ValidarEmpresas />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
