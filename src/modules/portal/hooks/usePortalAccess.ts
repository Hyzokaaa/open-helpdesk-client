import { useEffect, useState } from "react";
import useConfig from "@modules/app/hooks/useConfig";
import { getPortalInfo } from "../services/portal.service";
import { portalAccessOf, type PortalAccess } from "../domain/portal-access";

// Asked once per workspace and page: it changes only when an admin flips a setting
const known = new Map<string, PortalAccess>();

/** The settings an admin just saved in this tab, so its portal pages do not keep the old ones */
export function rememberPortalAccess(slug: string, access: PortalAccess): void {
  known.set(slug, access);
}

/**
 * Whether the workspace's portal and public knowledge base are open; null while it is not known.
 * A custom domain already says it; otherwise the portal is asked. A workspace that cannot be
 * found counts as open, so its pages show their own "not found".
 */
export default function usePortalAccess(slug: string | undefined): PortalAccess | null {
  const { domainWorkspaces } = useConfig();
  const fromDomain = domainWorkspaces?.find((w) => w.slug === slug);
  const [access, setAccess] = useState<PortalAccess | null>(() =>
    fromDomain ? portalAccessOf(fromDomain) : slug ? known.get(slug) ?? null : null);

  useEffect(() => {
    if (!slug) return;
    if (fromDomain) { setAccess(portalAccessOf(fromDomain)); return; }
    const cached = known.get(slug);
    if (cached) { setAccess(cached); return; }
    let live = true;
    getPortalInfo(slug)
      .then((info) => portalAccessOf(info))
      .catch(() => portalAccessOf(null))
      .then((result) => {
        known.set(slug, result);
        if (live) setAccess(result);
      });
    return () => { live = false; };
  }, [slug, fromDomain]);

  return access;
}
