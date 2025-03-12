// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage'; // Ensure filename matches
import Home from './components/Home';
import './App.css';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import Diagnosis from './components/Diagnosis';
import PatientHistory from './components/PatientHistory';
import PatientDetails from './components/PatientDetails';
import Logout from './components/Logout';
import PatientRegistration from './components/PatientRegistration';
import Layout from './components/layouts/Layout'; // Ensure correct case for `Layout.js`
import Reports from './components/Reports';
import MRIAnalysis from './components/MRIAnalysis';
import OutcomeAnalysis from './components/Outcome-Analysis';
import RoleManagement from './components/RoleManagement';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Require authentication */}
        <Route
          path="/home"
          element={
            <Layout>
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/diagnosis"
          element={
            <Layout>
              <PrivateRoute>
                <Diagnosis />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/patient-history"
          element={
            <Layout>
              <PrivateRoute>
                <PatientHistory />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/patient-details"
          element={
            <Layout>
              <PrivateRoute>
                <PatientDetails />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/patient-registration"
          element={
            <Layout>
              <PrivateRoute>
                <PatientRegistration />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/logout"
          element={
            <Layout>
              <PrivateRoute>
                <Logout />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/reports"
          element={
            <Layout>
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/mri-scan-analysis"
          element={
            <Layout>
              <PrivateRoute>
                <MRIAnalysis />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/outcome-analysis"
          element={
            <Layout>
              <PrivateRoute>
                <OutcomeAnalysis />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/role-management"
          element={
            <Layout>
              <PrivateRoute>
                <RoleManagement />
              </PrivateRoute>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
