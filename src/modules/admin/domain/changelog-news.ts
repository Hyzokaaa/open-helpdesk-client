import type { ChangelogVersion } from "@modules/app/services/changelog.service";

/** -1, 0 or 1, comparing "1.38.0" with "1.39.0"; a missing part counts as 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, "").split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

/** The newest version of the changelog, whatever order it came in. */
export function newestVersion(changelog: ChangelogVersion[]): string | null {
  return changelog.reduce<string | null>(
    (newest, v) => (newest === null || compareVersions(v.version, newest) > 0 ? v.version : newest),
    null,
  );
}

/**
 * The versions the admin has not seen yet, newest first: every version after the last one seen,
 * so whoever jumps several versions sees them all. Seen nothing yet in this browser: only the
 * newest, not the whole history.
 */
export function unseenVersions(changelog: ChangelogVersion[], lastSeen: string | null): ChangelogVersion[] {
  const sorted = [...changelog].sort((a, b) => compareVersions(b.version, a.version));
  if (!lastSeen) return sorted.slice(0, 1);
  return sorted.filter((v) => compareVersions(v.version, lastSeen) > 0);
}

export const changelogSeenKey = (userId: string) => `ohd_changelog_seen:${userId}`;
