import React from "react";
import ReactDOM from "react-dom/client";
import "./theme/tokens.css";
import "./theme/app-theme.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
