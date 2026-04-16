import { createContext } from "react";
import { AuthUser } from "../domain/auth-user";

export interface UserContextProps {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
}

export const UserContext = createContext<UserContextProps>(
  {} as UserContextProps,
);
