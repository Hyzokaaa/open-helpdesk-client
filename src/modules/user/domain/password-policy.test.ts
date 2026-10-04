import { describe, expect, it } from "vitest";
import { isPasswordAcceptable, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password-policy";

describe("isPasswordAcceptable", () => {
  it("rejects passwords shorter than the minimum, including the old 6-character floor", () => {
    expect(isPasswordAcceptable("abc123")).toBe(false);
    expect(isPasswordAcceptable("a".repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false);
  });

  it("accepts the minimum and maximum lengths", () => {
    expect(isPasswordAcceptable("a".repeat(PASSWORD_MIN_LENGTH))).toBe(true);
    expect(isPasswordAcceptable("a".repeat(PASSWORD_MAX_LENGTH))).toBe(true);
  });

  it("rejects passwords longer than the maximum", () => {
    expect(isPasswordAcceptable("a".repeat(PASSWORD_MAX_LENGTH + 1))).toBe(false);
  });

  it("rejects a password made only of whitespace", () => {
    expect(isPasswordAcceptable(" ".repeat(10))).toBe(false);
    expect(isPasswordAcceptable("\t".repeat(10))).toBe(false);
  });

  it("accepts a password containing spaces among other characters", () => {
    expect(isPasswordAcceptable("  correct horse  ")).toBe(true);
  });
});
