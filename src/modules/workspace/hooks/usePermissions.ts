import { useEffect, useState } from "react";
import { http } from "@modules/app/modules/http/domain/http";
import useUser from "@modules/user/hooks/useUser";

const cache = new Map<string, string[]>();
// Requests in flight, so components mounting together (sidebar, page, panels) share one call
const pending = new Map<string, Promise<string[]>>();

export function clearPermissionsCache() {
  cache.clear();
  pending.clear();
}

function fetchPermissions(cacheKey: string, workspaceSlug: string): Promise<string[]> {
  let request = pending.get(cacheKey);
  if (!request) {
    request = http
      .get<{ permissions: string[] }>(`/workspaces/${workspaceSlug}/permissions`)
      .then((res) => {
        cache.set(cacheKey, res.data.permissions);
        return res.data.permissions;
      })
      .finally(() => pending.delete(cacheKey));
    pending.set(cacheKey, request);
  }
  return request;
}

export default function usePermissions(workspaceSlug: string | undefined) {
  const { user } = useUser();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug || !user) {
      setLoading(false);
      return;
    }

    const cacheKey = `${user.id}:${workspaceSlug}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setPermissions(cached);
      setLoading(false);
      return;
    }

    fetchPermissions(cacheKey, workspaceSlug)
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [workspaceSlug, user?.id]);

  const can = (permission: string) => permissions.includes(permission);

  return { permissions, can, loading };
}
