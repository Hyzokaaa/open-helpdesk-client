import { useEffect, useState } from "react";
import { http } from "@modules/app/modules/http/domain/http";
import useUser from "@modules/user/hooks/useUser";
import { useMembershipChanged } from "../domain/membership-events";

interface MyPermissions {
  permissions: string[];
  /** Your own membership role, or null when you are not a member (a system admin may not be one) */
  role: string | null;
}

const cache = new Map<string, MyPermissions>();
// Requests in flight, so components mounting together (sidebar, page, panels) share one call
const pending = new Map<string, Promise<MyPermissions>>();

export function clearPermissionsCache() {
  cache.clear();
  pending.clear();
}

function fetchPermissions(cacheKey: string, workspaceSlug: string): Promise<MyPermissions> {
  let request = pending.get(cacheKey);
  if (!request) {
    request = http
      .get<MyPermissions>(`/workspaces/${workspaceSlug}/permissions`)
      .then((res) => {
        const result = { permissions: res.data.permissions, role: res.data.role ?? null };
        cache.set(cacheKey, result);
        return result;
      })
      .finally(() => pending.delete(cacheKey));
    pending.set(cacheKey, request);
  }
  return request;
}

export default function usePermissions(workspaceSlug: string | undefined) {
  const { user } = useUser();
  const cacheKey = user && workspaceSlug ? `${user.id}:${workspaceSlug}` : null;
  // Tagged with the workspace they belong to: on moving to another one, the previous answer
  // must not be read as this one's for the render before the new request starts
  const [mine, setMine] = useState<MyPermissions & { key: string | null }>({ permissions: [], role: null, key: null });
  const [version, setVersion] = useState(0);

  // Joining or leaving changes the role: drop this workspace from the cache and ask again
  useMembershipChanged(workspaceSlug, () => {
    if (user && workspaceSlug) cache.delete(`${user.id}:${workspaceSlug}`);
    setVersion((v) => v + 1);
  });

  useEffect(() => {
    if (!cacheKey || !workspaceSlug) return;

    const cached = cache.get(cacheKey);
    if (cached) {
      setMine({ ...cached, key: cacheKey });
      return;
    }

    let current = true;
    fetchPermissions(cacheKey, workspaceSlug)
      .then((result) => { if (current) setMine({ ...result, key: cacheKey }); })
      .catch(() => { if (current) setMine({ permissions: [], role: null, key: cacheKey }); });
    return () => { current = false; };
  }, [cacheKey, version]);

  // Without a workspace or a user there is nothing to wait for
  const loading = cacheKey !== null && mine.key !== cacheKey;
  const ready = cacheKey !== null && mine.key === cacheKey;
  const permissions = ready ? mine.permissions : [];
  const can = (permission: string) => permissions.includes(permission);

  return { permissions, role: ready ? mine.role : null, can, loading };
}
