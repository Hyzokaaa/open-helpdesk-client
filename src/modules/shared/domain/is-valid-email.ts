// Close enough to the backend's IsEmail to catch typos before a batch request,
// where a single malformed address makes the whole request fail.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** The trimmed addresses from a list of rows that are filled in but not valid. */
export function findInvalidEmails(emails: string[]): string[] {
  return emails.map((e) => e.trim()).filter((e) => e !== "" && !isValidEmail(e));
}
