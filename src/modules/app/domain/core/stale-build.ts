/**
 * After a deployment, a tab opened earlier still knows the previous build's file names. Loading a
 * screen it had not opened yet asks for a file that no longer exists. Reloading picks up the new
 * build; it is done once per tab and minute, so a file missing for any other reason does not loop.
 */
const RELOADED_AT = "ohd_reloaded_for_new_build";
const ONCE_PER_MS = 60_000;

const CHUNK_LOAD_ERROR = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return CHUNK_LOAD_ERROR.test(message);
}

/** Reloads the page unless it already did so a moment ago; says whether it reloads. */
export function reloadForNewBuild(now = Date.now()): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_AT) ?? 0);
    if (now - last < ONCE_PER_MS) return false;
    window.sessionStorage.setItem(RELOADED_AT, String(now));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
