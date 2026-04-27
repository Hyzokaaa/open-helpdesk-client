import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import clsx from "clsx";
import useUser from "@modules/user/hooks/useUser";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_NAME, APP_SUBTITLE } from "@modules/app/domain/constants/env";
import { Workspace, listWorkspaces } from "@modules/workspace/services/workspace.service";

interface NavItem {
  label: string;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { saasMode } = useConfig();
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (user) listWorkspaces().then(setWorkspaces);
  }, [user?.id]);

  const settingsNav: NavItem[] = [
    { label: t("settings.account"), path: "/dashboard/settings/account" },
    { label: t("settings.security"), path: "/dashboard/settings/security" },
    { label: t("settings.preferences"), path: "/dashboard/settings/preferences" },
    { label: t("notifications.preferences"), path: "/dashboard/settings/notifications" },
    ...(saasMode ? [{ label: t("sidebar.billing"), path: "/dashboard/settings/billing" }] : []),
  ];

  const workspaceNav: NavItem[] = workspaceSlug
    ? [
        { label: t("sidebar.tickets"), path: `/dashboard/workspaces/${workspaceSlug}/tickets` },
        { label: t("sidebar.members"), path: `/dashboard/workspaces/${workspaceSlug}/members` },
        { label: t("sidebar.tags"), path: `/dashboard/workspaces/${workspaceSlug}/tags` },
        ...(user?.isSystemAdmin ? [{ label: t("sidebar.settings"), path: `/dashboard/workspaces/${workspaceSlug}/settings` }] : []),
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;
  const isSettingsActive = location.pathname.startsWith("/dashboard/settings");
  const isWorkspacesActive = location.pathname.startsWith("/dashboard/workspaces");
  const isAdminActive = location.pathname.startsWith("/dashboard/admin");

  const linkClass = (active: boolean) =>
    clsx(
      "px-3 py-2 rounded-lg text-sm font-body-medium transition-colors",
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

  return (
    <aside className="fixed left-0 top-0 h-dvh w-[240px] bg-surface border-r border-border-card hidden lg:flex flex-col z-40">
      <div className="px-5 py-5 border-b border-border-card">
        <h1 className="text-base font-body-bold text-primary">
          {APP_NAME}
        </h1>
        {APP_SUBTITLE && (
          <p className="text-exs text-subtle font-body-medium">
            {APP_SUBTITLE}
          </p>
        )}
      </div>

      <nav className="flex flex-col px-3 py-4 gap-y-1 flex-1 overflow-auto">
        {/* Workspaces */}
        <Link
          to={workspaces.length > 0 ? `/dashboard/workspaces/${workspaces[0].slug}/tickets` : "/dashboard/settings/account"}
          className={linkClass(isWorkspacesActive)}
        >
          {t("sidebar.workspaces")}
        </Link>

        {isWorkspacesActive && workspaces.length > 0 && (
          <div className="ml-3 flex flex-col gap-y-0.5">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                to={`/dashboard/workspaces/${ws.slug}/tickets`}
                className={subLinkClass(workspaceSlug === ws.slug)}
              >
                {ws.name}
              </Link>
            ))}
          </div>
        )}

        {/* Workspace nav (when inside a workspace) */}
        {workspaceNav.length > 0 && (
          <>
            <div className="border-t border-border-card my-3" />
            <p className="px-3 text-exs text-subtle font-body-medium uppercase mb-1">
              {t("sidebar.workspace")}
            </p>
            {workspaceNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={linkClass(isActive(item.path))}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}

        {/* Settings */}
        <div className="border-t border-border-card my-3" />
        <Link
          to="/dashboard/settings/account"
          className={linkClass(isSettingsActive)}
        >
          {t("sidebar.settings")}
        </Link>

        {isSettingsActive && (
          <div className="ml-3 flex flex-col gap-y-0.5">
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
            <div className="border-t border-border-card my-3" />
            <p className="px-3 text-exs text-subtle font-body-medium uppercase mb-1">
              {t("sidebar.system")}
            </p>
            <Link
              to="/dashboard/admin/users"
              className={linkClass(isAdminActive)}
            >
              {t("sidebar.administration")}
            </Link>

            {isAdminActive && (
              <div className="ml-3 flex flex-col gap-y-0.5">
                <Link
                  to="/dashboard/admin/users"
                  className={subLinkClass(isActive("/dashboard/admin/users"))}
                >
                  {t("sidebar.adminUsers")}
                </Link>
                <Link
                  to="/dashboard/admin/workspaces"
                  className={subLinkClass(isActive("/dashboard/admin/workspaces"))}
                >
                  {t("sidebar.adminWorkspaces")}
                </Link>
              </div>
            )}
          </>
        )}

        {/* Changelog */}
        <div className="mt-auto pt-3 border-t border-border-card">
          <Link
            to="/dashboard/changelog"
            className={linkClass(isActive("/dashboard/changelog"))}
          >
            {t("sidebar.changelog")}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
