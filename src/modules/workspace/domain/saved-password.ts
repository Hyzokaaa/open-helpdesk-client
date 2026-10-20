/** The server and account a password was saved for, or is about to be used with. */
export interface PasswordTarget {
  host?: string | null;
  user?: string | null;
}

const same = (a?: string | null, b?: string | null) => !!a?.trim() && !!b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Whether an empty password field still means the saved password: the backend only uses it with
 * the server and user it was saved for (`passwordForConnectionTest`), so once either changes the
 * password has to be typed again.
 */
export function savedPasswordApplies(saved: PasswordTarget | null | undefined, current: PasswordTarget): boolean {
  return !!saved && same(saved.host, current.host) && same(saved.user, current.user);
}
