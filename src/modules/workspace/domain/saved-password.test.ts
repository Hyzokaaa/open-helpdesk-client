import { describe, expect, it } from "vitest";
import { savedPasswordApplies } from "./saved-password";

describe("savedPasswordApplies", () => {
  const saved = { host: "mail.example.com", user: "support@example.com" };

  it("applies with the same server and user, whatever the case and spaces", () => {
    expect(savedPasswordApplies(saved, { host: " MAIL.example.com", user: "Support@example.com " })).toBe(true);
  });

  it("no longer applies with another server", () => {
    expect(savedPasswordApplies(saved, { host: "smtp.example.com", user: "support@example.com" })).toBe(false);
  });

  it("no longer applies with another user", () => {
    expect(savedPasswordApplies(saved, { host: "mail.example.com", user: "sales@example.com" })).toBe(false);
  });

  it("does not apply while the server or user is empty", () => {
    expect(savedPasswordApplies(saved, { host: "", user: "support@example.com" })).toBe(false);
    expect(savedPasswordApplies(saved, { host: "mail.example.com", user: "  " })).toBe(false);
  });

  it("does not apply when nothing was saved", () => {
    expect(savedPasswordApplies(null, { host: "mail.example.com", user: "support@example.com" })).toBe(false);
    expect(savedPasswordApplies(undefined, { host: "mail.example.com", user: "support@example.com" })).toBe(false);
  });
});
