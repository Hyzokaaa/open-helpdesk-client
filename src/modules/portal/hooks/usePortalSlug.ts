import { useParams } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";

export default function usePortalSlug(): string | undefined {
  const { workspaceSlug } = useParams();
  const { domainWorkspaces } = useConfig();
  return workspaceSlug || domainWorkspaces?.[0]?.slug;
}

export function usePortalBasePath(): string {
  const { workspaceSlug } = useParams();
  return workspaceSlug ? `/portal/${workspaceSlug}` : "/portal";
}
