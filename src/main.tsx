import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./online-entry.css";
import App from "./App";
import { StartOverlay } from "./components/StartOverlay";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <StartOverlay />
  </StrictMode>
);