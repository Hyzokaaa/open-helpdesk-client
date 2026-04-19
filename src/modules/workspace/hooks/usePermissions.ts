import { useEffect, useState } from "react";
import { http } from "@modules/app/modules/http/domain/http";
import useUser from "@modules/user/hooks/useUser";

const cache = new Map<string, string[]>();

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

    http
      .get<{ permissions: string[] }>(
        `/workspaces/${workspaceSlug}/permissions`,
      )
      .then((res) => {
        cache.set(cacheKey, res.data.permissions);
        setPermissions(res.data.permissions);
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [workspaceSlug, user?.id]);

  const can = (permission: string) => permissions.includes(permission);

  return { permissions, can, loading };
}
