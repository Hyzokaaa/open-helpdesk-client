import { useCallback, useContext } from "react";
import { UserContext } from "../context/user-context";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { clearSession, markSignedOut } from "@modules/app/domain/core/session";
import { clearPermissionsCache } from "@modules/workspace/hooks/usePermissions";
import { logout } from "../services/auth.service";
import { markHandoffTried } from "../domain/session-handoff";

export default function useUser() {
  const { user, loading, setUser } = useContext(UserContext);

  const signOut = useCallback(() => {
    // End the session on the server too, so its refresh token stops working
    const refreshToken = LocalStorage.get(LOCAL_STORAGE_KEY.REFRESH_TOKEN);
    if (refreshToken) logout(refreshToken).catch(() => {});
    clearSession();
    markSignedOut();
    clearPermissionsCache();
    // Signing out ends the session on every address: no point looking for it on the way out
    markHandoffTried();
    setUser(null);
  }, [setUser]);

  return { user, loading, setUser, signOut };
}
