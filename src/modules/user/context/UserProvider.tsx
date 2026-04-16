import { useEffect, useState } from "react";
import { UserContext } from "./user-context";
import { AuthUser } from "../domain/auth-user";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { getProfile } from "../services/auth.service";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

    if (token) {
      getProfile()
        .then((profile) => setUser(profile))
        .catch(() => {
          LocalStorage.remove(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
