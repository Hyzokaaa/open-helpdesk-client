import { useEffect, useState } from "react";
import { UserContext } from "./user-context";
import { AuthUser } from "../domain/auth-user";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { getProfile } from "../services/auth.service";
import useTheme from "@modules/app/hooks/useTheme";
import { Theme } from "@modules/app/context/theme-context";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

    if (token) {
      getProfile()
        .then((profile) => {
          setUser(profile);
          LocalStorage.set(LOCAL_STORAGE_KEY.LANGUAGE, profile.language);
          if (profile.theme === "light" || profile.theme === "light-border" || profile.theme === "dark" || profile.theme === "dark-deep") {
            setTheme(profile.theme as Theme);
          }
        })
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
