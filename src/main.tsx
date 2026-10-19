import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "@modules/app/components/ErrorBoundary";
import "./index.css";
import { answerSessionPings, dropSessionIfBrowserWasClosed } from "@modules/app/domain/core/session";
import { reloadForNewBuild } from "@modules/app/domain/core/stale-build";
import { runSessionHandoffBeforeApp } from "@modules/user/domain/session-handoff-boot";

// A screen of the previous build failed to load after a deployment: the new build has it. The
// event is not cancelled: Vite would then resolve the import to nothing, and React would fail on
// that ("reading 'default'") with the error screen instead of waiting for the reload
window.addEventListener("vite:preloadError", () => {
  reloadForNewBuild();
});

answerSessionPings();
// A session that should have ended with the browser is dropped before anything uses it; then a
// trip between addresses of the installation (#37) is settled before the app starts
dropSessionIfBrowserWasClosed()
  .then(() => runSessionHandoffBeforeApp())
  .catch(() => false)
  .then((leaving) => {
    if (leaving) return;
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  });
