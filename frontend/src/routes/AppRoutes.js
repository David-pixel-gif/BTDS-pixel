import React from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "../components/layouts/Layout";
import PrivateRoute from "../components/PrivateRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Home from "../pages/Home";
import Diagnosis from "../pages/Diagnosis";
import DiagnosisChat from "../pages/DiagnosisChat";
import PatientHistory from "../pages/PatientHistory";
import PatientDetails from "../pages/PatientDetails";
import ProfilePage from "../pages/ProfilePage";
import PatientRegistration from "../pages/PatientRegistration";
import Logout from "../pages/Logout";
import Reports from "../pages/Reports";
import MRIAnalysis from "../pages/MRIAnalysis";
import OutcomeAnalysis from "../pages/OutcomeAnalysis";
import RoleManagement from "../pages/RoleManagement";
import NotFound from "../pages/NotFound";

const publicRoutes = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
];

const protectedRoutes = [
  { path: "/home", element: <Home /> },
  { path: "/diagnosis", element: <Diagnosis /> },
  { path: "/diagnosis-chat", element: <DiagnosisChat /> },
  { path: "/patient-history", element: <PatientHistory /> },
  { path: "/patient-details", element: <PatientDetails /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/patient-registration", element: <PatientRegistration /> },
  { path: "/logout", element: <Logout /> },
  { path: "/reports", element: <Reports /> },
  { path: "/mri-scan-analysis", element: <MRIAnalysis /> },
  { path: "/outcome-analysis", element: <OutcomeAnalysis /> },
  { path: "/role-management", element: <RoleManagement /> },
];

function renderProtectedElement(element) {
  return (
    <PrivateRoute>
      <Layout>{element}</Layout>
    </PrivateRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={renderProtectedElement(route.element)}
        />
      ))}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
