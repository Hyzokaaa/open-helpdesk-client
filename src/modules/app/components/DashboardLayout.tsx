import { Navigate, Outlet } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const { user, loading } = useUser();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="w-full flex min-h-dvh bg-page">
      <Sidebar />

      <div className="w-full flex flex-col grow lg:pl-[240px]">
        <Navbar />

        <div className="flex flex-col items-center px-6 md:px-8 w-full">
          <main
            className="flex flex-col grow w-full items-center py-6"
            style={{ maxWidth: "1200px" }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
