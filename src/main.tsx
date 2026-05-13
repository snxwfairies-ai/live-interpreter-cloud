import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const mount = () =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode><App /></React.StrictMode>
  );

// Capacitor device-ready
if ((window as any).Capacitor?.isNativePlatform?.()) {
  document.addEventListener("deviceready", mount, false);
} else {
  mount();
}
