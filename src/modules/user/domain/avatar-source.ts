export type AvatarSource =
  | { kind: "photo"; url: string }
  | { kind: "blob"; seed: string }
  | { kind: "initials"; initials: string };

interface AvatarPerson {
  avatarUrl?: string | null;
  userId?: string | null;
  firstName?: string;
  lastName?: string;
}

/**
 * What a user's avatar shows: their photo, else their openblob, drawn from the id so it
 * survives renames and is the same everywhere. Without an id there is no stable seed, so
 * the initials stay (empty when there is no name either: the caller shows an icon).
 */
export function avatarSource({ avatarUrl, userId, firstName, lastName }: AvatarPerson): AvatarSource {
  if (avatarUrl) return { kind: "photo", url: avatarUrl };
  if (userId) return { kind: "blob", seed: userId };
  return { kind: "initials", initials: ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() };
}
