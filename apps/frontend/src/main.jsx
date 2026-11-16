import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initializeTheme } from "./theme/theme";
import "@somenergia/brand/fonts.css";
import "@somenergia/design-tokens/tokens.css";
import "./styles.css";

initializeTheme();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
