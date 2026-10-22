import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import ErrorBoundary from "@modules/app/components/ErrorBoundary";
import { runAppStart } from "@modules/app/domain/core/app-start";
import { answerSessionPings, dropSessionIfBrowserWasClosed } from "@modules/app/domain/core/session";
import { reloadForNewBuild } from "@modules/app/domain/core/stale-build";
import { runSessionHandoffBeforeApp } from "@modules/user/domain/session-handoff-boot";

/**
 * Starts the app. Every build (core and cloud) goes through here, so none of them skips a step:
 * the cloud once mounted its app directly, and custom domains could not sign in (#37).
 */
export function startApp(app: ReactNode): Promise<void> {
  return runAppStart({
    listen: () => {
      // A screen of the previous build failed to load after a deployment: the new build has it. The
      // event is not cancelled: Vite would then resolve the import to nothing, and React would fail on
      // that ("reading 'default'") with the error screen instead of waiting for the reload
      window.addEventListener("vite:preloadError", () => {
        reloadForNewBuild();
      });
      answerSessionPings();
    },
    settleSession: dropSessionIfBrowserWasClosed,
    settleHandoff: runSessionHandoffBeforeApp,
    mount: () => {
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          <ErrorBoundary>{app}</ErrorBoundary>
        </StrictMode>,
      );
    },
  });
}
