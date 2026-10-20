import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import { wasSignedOutHere } from "@modules/app/domain/core/session";
import { panelEntry, panelSignInPath } from "@modules/app/domain/core/entry";
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
  const path = location.pathname + location.search;
  const hasSession = !!LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  // The trip to the installation's address is decided once: it marks itself as tried, and a
  // render meanwhile must not fall back to the sign-in page
  const [pickUpSession] = useState(() => panelEntry({
    hasSession,
    canHandoff: canReceiveHandoff(appUrl, !!domainWorkspaces),
    handoffTriedRecently: handoffAlreadyTried(),
    signedOutHere: wasSignedOutHere(),
    path,
  }).kind === "handoff");

  useEffect(() => {
    if (pickUpSession && appUrl) void startReceive(appUrl, path);
  }, [pickUpSession, appUrl, path]);

  if (pickUpSession) return null;

  if (!hasSession) return <Navigate to={panelSignInPath(wasSignedOutHere(), path)} replace />;

  if (loading) return null;

  return <Outlet />;
}
