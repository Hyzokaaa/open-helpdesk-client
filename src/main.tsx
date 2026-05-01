import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { APP_NAME, APP_SUBTITLE } from "@modules/app/domain/constants/env";

document.title = APP_SUBTITLE ? `${APP_NAME} ${APP_SUBTITLE}` : APP_NAME;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
