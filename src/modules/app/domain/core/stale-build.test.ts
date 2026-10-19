import { afterEach, describe, expect, it, vi } from "vitest";
import { isChunkLoadError } from "./stale-build";

describe("isChunkLoadError", () => {
  it("recognises a file of the previous build that no longer exists, in each browser's words", () => {
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module: https://x/assets/custom-field.service-BvGlxSdn.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/a.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
  });

  it("leaves any other error to the error screen", () => {
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});

describe("reloadForNewBuild", () => {
  afterEach(() => vi.unstubAllGlobals());

  function tab(lastReload?: number) {
    const stored = new Map<string, string>(lastReload ? [["ohd_reloaded_for_new_build", String(lastReload)]] : []);
    const reload = vi.fn();
    vi.stubGlobal("window", {
      location: { reload },
      sessionStorage: { getItem: (k: string) => stored.get(k) ?? null, setItem: (k: string, v: string) => stored.set(k, v) },
    });
    return reload;
  }

  // A fresh module per test: the "already asked" mark lives for the page
  const load = async () => {
    vi.resetModules();
    return (await import("./stale-build")).reloadForNewBuild;
  };

  it("reloads once, and every later failure of the same page waits for that reload", async () => {
    const reload = tab();
    const reloadForNewBuild = await load();
    expect(reloadForNewBuild(1_000_000)).toBe(true);
    expect(reloadForNewBuild(1_000_100)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload again within a minute of the last reload, so a file missing for good does not loop", async () => {
    const reload = tab(1_000_000);
    const reloadForNewBuild = await load();
    expect(reloadForNewBuild(1_030_000)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
