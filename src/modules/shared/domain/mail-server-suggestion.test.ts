import { describe, expect, it } from "vitest";
import { emailDomain, shouldApplySuggestion, suggestionFor } from "./mail-server-suggestion";

const suggestion = { domain: "acme.com", host: "mail.acme.com", port: 587, source: "mx" as const };

describe("emailDomain", () => {
  it("reads the domain of an address", () => {
    expect(emailDomain("Ana@Acme.COM")).toBe("acme.com");
    expect(emailDomain("ana@")).toBe("");
    expect(emailDomain("ana")).toBe("");
    expect(emailDomain("ana@local")).toBe("");
  });
});

describe("suggestionFor", () => {
  it("uses what the server found, or guesses the usual name", () => {
    expect(suggestionFor("smtp", "acme.com", { smtp: { host: "mail.acme.com", port: 465, source: "srv" } }))
      .toEqual({ domain: "acme.com", host: "mail.acme.com", port: 465, source: "srv" });
    expect(suggestionFor("imap", "acme.com", {})).toEqual({ domain: "acme.com", host: "imap.acme.com", port: 993, source: "guess" });
  });
});

describe("shouldApplySuggestion", () => {
  it("fills an empty host", () => {
    expect(shouldApplySuggestion({ suggestion, appliedDomain: "", hostTyped: false, currentHost: "" })).toBe(true);
  });

  it("keeps the host saved for the same domain", () => {
    expect(shouldApplySuggestion({ suggestion, appliedDomain: "acme.com", hostTyped: false, currentHost: "smtp.acme.com" })).toBe(false);
  });

  it("brings the new domain's host when the address changes domain, even over a saved one", () => {
    expect(shouldApplySuggestion({ suggestion, appliedDomain: "old.com", hostTyped: false, currentHost: "mail.old.com" })).toBe(true);
  });

  it("never overwrites a host the person typed", () => {
    expect(shouldApplySuggestion({ suggestion, appliedDomain: "old.com", hostTyped: true, currentHost: "relay.mine.net" })).toBe(false);
  });
});
