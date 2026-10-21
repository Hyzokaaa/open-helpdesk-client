import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";
import PageLoader from "@modules/shared/components/PageLoader/PageLoader";
import { getOnboarding } from "@modules/onboarding/services/onboarding.service";
import { PaletteProvider } from "@modules/workspace/context/PaletteProvider";
import { listWorkspaces } from "@modules/workspace/services/workspace.service";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import RouteSuspense from "./RouteSuspense";
import BrandLogo from "./BrandLogo";
import useExtensions from "@modules/app/extensions/useExtensions";
import NotMemberBar from "@modules/workspace/components/NotMemberBar";
import UnsavedChangesProvider from "@modules/app/context/UnsavedChangesProvider";
import useSidebarCollapsed from "@modules/app/hooks/useSidebarCollapsed";
import clsx from "clsx";

function NoAccessScreen() {
  const { t } = useTranslation();
  const { brandName, brandLogo } = useConfig();
  const { signOut } = useUser();

  const handleLogout = () => {
    signOut();
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
  // A step still pending (verify the email, choose a plan…) is done in the onboarding first
  const [onboardingPending, setOnboardingPending] = useState<boolean | null>(null);
  const location = useLocation();
  const sidebar = useSidebarCollapsed(user?.id);

  useEffect(() => {
    if (!user) return;
    getOnboarding()
      .then((state) => setOnboardingPending(state.nextStep !== null))
      .catch(() => setOnboardingPending(false));
  }, [user?.id, user?.isEmailVerified]);

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

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading || configLoading || !accessChecked || onboardingPending === null) return <PageLoader />;
  if (onboardingPending) {
    return <Navigate to={`/onboarding?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (domainWorkspaces && !hasAccess) return <NoAccessScreen />;

  return (
    <PaletteProvider>
      <UnsavedChangesProvider>
      <div className="w-full flex h-dvh bg-page overflow-hidden">
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebar.collapsed} onToggleCollapsed={sidebar.toggle} />

        <div className={clsx(
          "w-full flex flex-col grow overflow-hidden transition-[padding] duration-200 ease-[cubic-bezier(.2,0,0,1)] motion-reduce:transition-none",
          sidebar.collapsed ? "lg:pl-16" : "lg:pl-[240px]",
        )}>
          <DashboardBanner />
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} drawerOpen={sidebarOpen} />
          <NotMemberBar />

          <div data-scroll-root className="flex flex-col items-center px-6 md:px-8 w-full flex-1 overflow-y-auto">
            <main
              tabIndex={-1}
              className="flex flex-col grow w-full items-center py-6 min-h-0 outline-none"
              style={{ maxWidth: "1200px" }}
            >
              <RouteSuspense>
                <Outlet />
              </RouteSuspense>
            </main>
          </div>
        </div>
      </div>
      </UnsavedChangesProvider>
    </PaletteProvider>
  );
}
