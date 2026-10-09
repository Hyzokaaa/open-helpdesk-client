import { describe, expect, it } from "vitest";
import { mailboxSaveBlocker } from "./mailbox-save";

const ready = { hasAddress: true, canTest: true, testResult: { success: true }, isEdit: false };

describe("mailboxSaveBlocker", () => {
  it("lets a tested mailbox be saved", () => {
    expect(mailboxSaveBlocker(ready)).toBeNull();
  });

  it("asks for the address first, then the connection details", () => {
    expect(mailboxSaveBlocker({ ...ready, hasAddress: false, canTest: false })).toBe("address");
    expect(mailboxSaveBlocker({ ...ready, canTest: false })).toBe("connection");
  });

  it("asks for a test, and for a new one after a failure", () => {
    expect(mailboxSaveBlocker({ ...ready, testResult: null })).toBe("test");
    expect(mailboxSaveBlocker({ ...ready, testResult: { success: false } })).toBe("testFailed");
  });

  it("does not ask an existing mailbox to be tested again", () => {
    expect(mailboxSaveBlocker({ ...ready, testResult: null, isEdit: true })).toBeNull();
  });
});
