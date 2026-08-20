import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import EmailVerificationBanner from "@modules/user/components/EmailVerificationBanner";
import { PaletteProvider } from "@modules/workspace/context/PaletteProvider";
import { listWorkspaces } from "@modules/workspace/services/workspace.service";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import useExtensions from "@modules/app/extensions/useExtensions";

function NoAccessScreen() {
  const { t } = useTranslation();
  const { brandName, brandLogo } = useConfig();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="text-center max-w-sm">
        {brandLogo && <BrandLogo src={brandLogo} size="xl" className="mx-auto mb-4" />}
        <h1 className="text-lg font-body-bold text-heading mb-2">{brandName}</h1>
        <p className="text-sm text-muted mb-6">{t("dashboard.noAccess")}</p>
        <button onClick={handleLogout} className="text-sm text-primary hover:underline">{t("nav.signOut")}</button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, loading } = useUser();
  const { loading: configLoading, domainWorkspaces } = useConfig();
  const { DashboardBanner } = useExtensions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    if (!user || !domainWorkspaces) {
      setAccessChecked(true);
      return;
    }
    const domainSlugs = domainWorkspaces.map((w) => w.slug);
    listWorkspaces().then((workspaces) => {
      const match = workspaces.some((ws) => domainSlugs.includes(ws.slug));
      setHasAccess(match);
    }).catch(() => setHasAccess(false)).finally(() => setAccessChecked(true));
  }, [user?.id, domainWorkspaces]);

  if (loading || configLoading || !accessChecked) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isEmailVerified) return <EmailVerificationBanner />;
  if (domainWorkspaces && !hasAccess) return <NoAccessScreen />;

  return (
    <PaletteProvider>
      <div className="w-full flex h-dvh bg-page overflow-hidden">
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="w-full flex flex-col grow lg:pl-[240px] overflow-hidden">
          <DashboardBanner />
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          <div className="flex flex-col items-center px-6 md:px-8 w-full flex-1 overflow-y-auto">
            <main
              className="flex flex-col grow w-full items-center py-6 min-h-0"
              style={{ maxWidth: "1200px" }}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </PaletteProvider>
  );
}
