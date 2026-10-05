import { describe, expect, it } from "vitest";
import { findInvalidEmails, isValidEmail } from "./is-valid-email";

describe("isValidEmail", () => {
  it("accepts ordinary addresses, ignoring surrounding spaces", () => {
    expect(isValidEmail("ana@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@mail.example.co")).toBe(true);
    expect(isValidEmail("  ana@example.com  ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("ana")).toBe(false);
    expect(isValidEmail("ana@")).toBe(false);
    expect(isValidEmail("ana@example")).toBe(false);
    expect(isValidEmail("ana@example.c")).toBe(false);
    expect(isValidEmail("ana smith@example.com")).toBe(false);
    expect(isValidEmail("ana@@example.com")).toBe(false);
    expect(isValidEmail("ana@example..com")).toBe(false);
    expect(isValidEmail("apikey")).toBe(false);
  });
});

describe("findInvalidEmails", () => {
  it("skips empty rows and returns the trimmed invalid ones", () => {
    expect(findInvalidEmails(["", "  ", " ok@example.com ", " bad@ "])).toEqual(["bad@"]);
  });
});
