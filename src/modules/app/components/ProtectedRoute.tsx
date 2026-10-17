import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { wasSignedOutHere } from "@modules/app/domain/core/session";
import { canReceiveHandoff, handoffAlreadyTried, startReceive } from "@modules/user/domain/session-handoff";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "@modules/user/hooks/useUser";

export default function ProtectedRoute() {
  const { loading } = useUser();
  const { appUrl, domainWorkspaces } = useConfig();
  const location = useLocation();
  const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  // On a custom domain, go straight for the session of the installation's address (#37). Decided
  // once: the trip marks itself as tried, and a render meanwhile must not fall back to the sign-in page
  const [pickUpSession] = useState(() => !token && canReceiveHandoff(appUrl, !!domainWorkspaces) && !handoffAlreadyTried());

  useEffect(() => {
    if (pickUpSession && appUrl) void startReceive(appUrl, location.pathname + location.search);
  }, [pickUpSession, appUrl, location.pathname, location.search]);

  if (pickUpSession) return null;

  if (!token) {
    // Someone who just signed out goes to a plain sign-in page; anyone else comes back here once signed in
    if (wasSignedOutHere()) return <Navigate to="/login" replace />;
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (loading) return null;

  return <Outlet />;
}
