/** What every build of the app does before showing anything, in this order. */
export interface AppStartSteps {
  /** Listeners that must be there from the first moment (new build, session pings) */
  listen(): void;
  /** Drops a session that should have ended with the browser, before anything uses it */
  settleSession(): Promise<void>;
  /** Settles a trip between addresses of the installation (#37); true when the page is leaving */
  settleHandoff(): Promise<boolean>;
  mount(): void;
}

/**
 * Runs the start steps. A failing step does not keep the app from starting; a page that is
 * leaving for another address does not mount it.
 */
export async function runAppStart(steps: AppStartSteps): Promise<void> {
  steps.listen();
  const leaving = await steps.settleSession()
    .then(() => steps.settleHandoff())
    .catch(() => false);
  if (!leaving) steps.mount();
}
