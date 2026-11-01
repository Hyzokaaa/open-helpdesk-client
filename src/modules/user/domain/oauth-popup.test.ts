import { describe, expect, it } from "vitest";
import { oauthSuccessMessage, readOAuthSuccess } from "./oauth-popup";

describe("OAuth popup message", () => {
  it("carries the provider of a new account to the opener", () => {
    expect(readOAuthSuccess(oauthSuccessMessage("google"))).toEqual({ signupMethod: "google" });
  });

  it("carries no provider when the sign-in found an existing account", () => {
    expect(readOAuthSuccess(oauthSuccessMessage())).toEqual({ signupMethod: null });
  });

  it("ignores anything else posted to the window", () => {
    expect(readOAuthSuccess("oauth:success")).toBeNull();
    expect(readOAuthSuccess({ type: "other" })).toBeNull();
    expect(readOAuthSuccess(null)).toBeNull();
    expect(readOAuthSuccess({ type: "oauth:success", signupMethod: 42 })).toEqual({ signupMethod: null });
  });
});
