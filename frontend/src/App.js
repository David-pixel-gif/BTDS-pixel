import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "./App.css";
import { validateEndpointContract } from "./api";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    validateEndpointContract().then((result) => {
      if (!result.ok) {
        console.warn('API contract mismatch detected.', result);
      }
    });
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </Router>
  );
}

export default App;
