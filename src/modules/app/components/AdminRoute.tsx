import { Navigate, Outlet } from "react-router";
import useUser from "@modules/user/hooks/useUser";

export default function AdminRoute() {
  const { user } = useUser();

  if (!user?.isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
