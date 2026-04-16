import { useCallback, useContext } from "react";
import { UserContext } from "../context/user-context";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";

export default function useUser() {
  const { user, loading, setUser } = useContext(UserContext);

  const signOut = useCallback(() => {
    LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
    setUser(null);
  }, [setUser]);

  return { user, loading, setUser, signOut };
}
