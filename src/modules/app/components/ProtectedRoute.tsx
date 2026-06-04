import { Navigate, Outlet } from "react-router";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "@modules/user/hooks/useUser";

export default function ProtectedRoute() {
  const { loading } = useUser();
  const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return null;

  return <Outlet />;
}
