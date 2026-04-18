import { useEffect, useState } from "react";
import { http } from "@modules/app/modules/http/domain/http";

const cache = new Map<string, string[]>();

export default function usePermissions(workspaceSlug: string | undefined) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug) {
      setLoading(false);
      return;
    }

    const cached = cache.get(workspaceSlug);
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
        cache.set(workspaceSlug, res.data.permissions);
        setPermissions(res.data.permissions);
      })
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  const can = (permission: string) => permissions.includes(permission);

  return { permissions, can, loading };
}
