import { describe, expect, it } from "vitest";
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
