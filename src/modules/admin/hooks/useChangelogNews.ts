import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import useUser from "@modules/user/hooks/useUser";
import { getChangelog, type ChangelogVersion } from "@modules/app/services/changelog.service";
import { changelogSeenKey, newestVersion, unseenVersions } from "../domain/changelog-news";

// One request per page load, shared by the sidebar and the Updates page; a failed one is retried later
let loading: Promise<ChangelogVersion[]> | null = null;
function loadChangelog(): Promise<ChangelogVersion[]> {
  loading ??= getChangelog().then((changelog) => {
    if (changelog.length === 0) loading = null;
    return changelog;
  });
  return loading;
}

// What was seen lives in the browser; without storage it lasts the visit
const inMemory = new Map<string, string>();
const listeners = new Set<() => void>();

function readSeen(key: string | null): string | null {
  if (!key) return null;
  try {
    return window.localStorage.getItem(key) ?? inMemory.get(key) ?? null;
  } catch {
    return inMemory.get(key) ?? null;
  }
}

function writeSeen(key: string, version: string): void {
  inMemory.set(key, version);
  try {
    window.localStorage.setItem(key, version);
  } catch { /* private mode: remembered until the page is closed */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The changelog versions the system admin has not seen yet, and a way to mark them seen.
 * Loads nothing until `enabled`, so only those who see Administration ask for the changelog.
 */
export default function useChangelogNews(enabled: boolean) {
  const { user } = useUser();
  const key = user?.id ? changelogSeenKey(user.id) : null;
  const [changelog, setChangelog] = useState<ChangelogVersion[] | null>(null);
  const lastSeen = useSyncExternalStore(subscribe, () => readSeen(key), () => readSeen(key));

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadChangelog().then((c) => live && setChangelog(c));
    return () => { live = false; };
  }, [enabled]);

  const markSeen = useCallback(() => {
    const newest = changelog ? newestVersion(changelog) : null;
    if (key && newest) writeSeen(key, newest);
  }, [changelog, key]);

  return {
    /** Null while loading. */
    changelog,
    unseen: changelog && key ? unseenVersions(changelog, lastSeen) : [],
    markSeen,
  };
}
