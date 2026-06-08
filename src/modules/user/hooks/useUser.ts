import { useCallback, useContext } from "react";
import { UserContext } from "../context/user-context";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { clearPermissionsCache } from "@modules/workspace/hooks/usePermissions";

export default function useUser() {
  const { user, loading, setUser } = useContext(UserContext);

  const signOut = useCallback(() => {
    LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
    clearPermissionsCache();
    setUser(null);
  }, [setUser]);

  return { user, loading, setUser, signOut };
}
