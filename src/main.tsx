import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "@modules/app/components/ErrorBoundary";
import "./index.css";
import { answerSessionPings, dropSessionIfBrowserWasClosed } from "@modules/app/domain/core/session";

answerSessionPings();
// A session that should have ended with the browser is dropped before anything uses it
dropSessionIfBrowserWasClosed().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
});
