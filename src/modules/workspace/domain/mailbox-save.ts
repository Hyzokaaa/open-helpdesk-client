interface MailboxSaveState {
  hasAddress: boolean;
  canTest: boolean;
  testResult: { success: boolean } | null;
  isEdit: boolean;
}

export type MailboxSaveBlocker = "address" | "connection" | "test" | "testFailed";

/**
 * What still stands between the form and a saved mailbox, so a greyed-out button says what to do
 * instead of reading as broken. An existing mailbox can be saved without testing again.
 */
export function mailboxSaveBlocker({ hasAddress, canTest, testResult, isEdit }: MailboxSaveState): MailboxSaveBlocker | null {
  if (!hasAddress) return "address";
  if (!canTest) return "connection";
  if (isEdit || testResult?.success) return null;
  return testResult ? "testFailed" : "test";
}
