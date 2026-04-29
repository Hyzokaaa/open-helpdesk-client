import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import clsx from "clsx";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_NAME } from "@modules/app/domain/constants/env";
import { Workspace, listWorkspaces } from "@modules/workspace/services/workspace.service";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { saasMode } = useConfig();
  const { t } = useTranslation();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const wsSwitcherRef = useRef<HTMLDivElement>(null);
  const [wsSwitcherOpen, setWsSwitcherOpen] = useState(false);
  const [lastSlug, setLastSlug] = useState<string | null>(null);

  const isSettingsActive = location.pathname.startsWith("/dashboard/settings");
  const isAdminActive = location.pathname.startsWith("/dashboard/admin");
  const isWorkspacesActive = location.pathname.startsWith("/dashboard/workspaces");

  const [wsOpen, setWsOpen] = useState(!!workspaceSlug);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);
  const [adminOpen, setAdminOpen] = useState(isAdminActive);

  const currentSlug = workspaceSlug ?? lastSlug;
  const activeWs = workspaces.find((ws) => ws.slug === currentSlug);

  useEffect(() => {
    if (user) listWorkspaces().then(setWorkspaces);
  }, [user?.id, location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsSwitcherRef.current && !wsSwitcherRef.current.contains(e.target as Node)) {
        setWsSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (workspaceSlug) {
      setLastSlug(workspaceSlug);
      setWsOpen(true);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
    if (isAdminActive) setAdminOpen(true);
  }, [isSettingsActive, isAdminActive]);

  const isActive = (path: string) => location.pathname === path;

  const workspaceNav = currentSlug
    ? [
        { label: t("sidebar.tickets"), path: `/dashboard/workspaces/${currentSlug}/tickets` },
        { label: t("sidebar.members"), path: `/dashboard/workspaces/${currentSlug}/members` },
        { label: t("sidebar.tags"), path: `/dashboard/workspaces/${currentSlug}/tags` },
        ...(user?.isSystemAdmin ? [{ label: t("sidebar.settings"), path: `/dashboard/workspaces/${currentSlug}/settings` }] : []),
      ]
    : [];

  const settingsNav = [
    { label: t("settings.account"), path: "/dashboard/settings/account" },
    { label: t("settings.security"), path: "/dashboard/settings/security" },
    { label: t("settings.preferences"), path: "/dashboard/settings/preferences" },
    { label: t("notifications.preferences"), path: "/dashboard/settings/notifications" },
    ...(saasMode ? [{ label: t("sidebar.billing"), path: "/dashboard/settings/billing" }] : []),
  ];

  const adminNav = [
    { label: t("sidebar.adminUsers"), path: "/dashboard/admin/users" },
    { label: t("sidebar.adminWorkspaces"), path: "/dashboard/admin/workspaces" },
  ];

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navLinkClass = (active: boolean) =>
    clsx(
      "px-3 py-1.5 rounded-lg text-sm font-body-medium transition-colors",
      active
        ? "bg-surface-active text-primary"
        : "text-secondary-text hover:bg-surface-hover",
    );

  const subLinkClass = (active: boolean) =>
    clsx(
      "px-3 py-1.5 rounded-lg text-xs font-body-medium transition-colors",
      active
        ? "text-primary"
        : "text-secondary-text hover:text-primary",
    );

  const sectionToggleClass = (active: boolean) =>
    clsx(
      "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-body-medium transition-colors cursor-pointer uppercase",
      active
        ? "text-primary"
        : "text-subtle hover:text-secondary-text",
    );

  return (
    <aside className="fixed left-0 top-0 h-dvh w-[240px] bg-surface border-r border-border-card hidden lg:flex flex-col z-40">
      {/* App brand */}
      <Link to="/dashboard" className="block px-4 py-4 border-b border-border-card hover:bg-surface-hover transition-colors">
        <h1 className="text-base font-body-bold text-primary">{APP_NAME}</h1>
        <p className="text-exs text-subtle font-body-medium">Helpdesk</p>
      </Link>

      {/* Workspace switcher */}
      <div ref={wsSwitcherRef} className="relative">
        <button
          onClick={() => workspaces.length > 0 ? setWsSwitcherOpen(!wsSwitcherOpen) : navigate("/dashboard/workspaces/new")}
          className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-card hover:bg-surface-hover transition-colors cursor-pointer text-left"
        >
          {activeWs && (
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-body-bold text-primary">
                {initials(activeWs.name)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {activeWs ? (
              <>
                <p className="text-sm font-body-bold text-heading truncate">{activeWs.name}</p>
                <p className="text-exs text-subtle font-body-medium truncate">{activeWs.slug}</p>
              </>
            ) : (
              <p className="text-sm font-body-medium text-subtle">
                {workspaces.length > 0 ? t("sidebar.selectWorkspace") : t("sidebar.createWorkspace")}
              </p>
            )}
          </div>
          {workspaces.length > 0 && (
            <span className="text-subtle text-xs shrink-0">{wsSwitcherOpen ? "▴" : "▾"}</span>
          )}
        </button>

        {wsSwitcherOpen && (
          <div className="absolute left-3 right-3 z-50 mt-1 bg-surface border border-border-input rounded-lg shadow-lg py-1 max-h-64 overflow-auto">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  navigate(`/dashboard/workspaces/${ws.slug}/tickets`);
                  setWsSwitcherOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer",
                  ws.slug === currentSlug
                    ? "bg-surface-active"
                    : "hover:bg-surface-hover",
                )}
              >
                <div className={clsx(
                  "w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-exs font-body-bold",
                  ws.slug === currentSlug
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-hover text-subtle",
                )}>
                  {initials(ws.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "text-xs font-body-semibold truncate",
                    ws.slug === currentSlug ? "text-primary" : "text-heading",
                  )}>
                    {ws.name}
                  </p>
                </div>
              </button>
            ))}
            <div className="border-t border-border-card mt-1 pt-1">
              <Link
                to="/dashboard/workspaces/new"
                onClick={() => setWsSwitcherOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-body-medium text-subtle hover:text-primary hover:bg-surface-hover transition-colors rounded-md"
              >
                <span className="w-7 h-7 rounded-md bg-surface-hover flex items-center justify-center text-sm">+</span>
                {t("workspaces.newWorkspace")}
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="flex flex-col px-3 py-3 gap-y-0.5 flex-1 overflow-auto">
        {/* Workspace nav */}
        {currentSlug && (
          <>
            <button
              onClick={() => setWsOpen(!wsOpen)}
              className={sectionToggleClass(isWorkspacesActive)}
            >
              {t("sidebar.workspace")}
              <span className="text-exs">{wsOpen ? "▾" : "▸"}</span>
            </button>

            {wsOpen && (
              <div className="flex flex-col gap-y-0.5">
                {workspaceNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subLinkClass(isActive(item.path))}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Settings */}
        <div className="border-t border-border-card my-2" />
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={sectionToggleClass(isSettingsActive)}
        >
          {t("sidebar.settings")}
          <span className="text-exs">{settingsOpen ? "▾" : "▸"}</span>
        </button>

        {settingsOpen && (
          <div className="flex flex-col gap-y-0.5">
            {settingsNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={subLinkClass(isActive(item.path))}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}

        {/* System admin */}
        {user?.isSystemAdmin && (
          <>
            <div className="border-t border-border-card my-2" />
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={sectionToggleClass(isAdminActive)}
            >
              {t("sidebar.administration")}
              <span className="text-exs">{adminOpen ? "▾" : "▸"}</span>
            </button>

            {adminOpen && (
              <div className="flex flex-col gap-y-0.5">
                {adminNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subLinkClass(isActive(item.path))}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* Changelog */}
        <div className="mt-auto pt-2 border-t border-border-card">
          <Link
            to="/dashboard/changelog"
            className={subLinkClass(isActive("/dashboard/changelog"))}
          >
            {t("sidebar.changelog")}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
