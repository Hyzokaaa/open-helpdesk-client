import { Navigate, Outlet } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";

export default function AdminRoute() {
  const { user } = useUser();
  const { domainWorkspaces, saasMode } = useConfig();

  if (!user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // In SaaS mode, admin routes are not accessible from custom domains
  if (saasMode && domainWorkspaces) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
