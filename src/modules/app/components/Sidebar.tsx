import { Link, useLocation, useParams } from "react-router";
import clsx from "clsx";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

interface NavItem {
  label: string;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { workspaceSlug } = useParams();
  const { user } = useUser();
  const { t } = useTranslation();

  const mainNav: NavItem[] = [
    { label: t("sidebar.workspaces"), path: "/dashboard/workspaces" },
    { label: t("sidebar.settings"), path: "/dashboard/settings" },
  ];

  const workspaceNav: NavItem[] = workspaceSlug
    ? [
        { label: t("sidebar.tickets"), path: `/dashboard/workspaces/${workspaceSlug}/tickets` },
        { label: t("sidebar.members"), path: `/dashboard/workspaces/${workspaceSlug}/members` },
        { label: t("sidebar.tags"), path: `/dashboard/workspaces/${workspaceSlug}/tags` },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (active: boolean) =>
    clsx(
      "px-3 py-2 rounded-lg text-sm font-body-medium transition-colors",
      active
        ? "bg-surface-active text-primary"
        : "text-secondary-text hover:bg-surface-hover",
    );

  return (
    <aside className="fixed left-0 top-0 h-dvh w-[240px] bg-surface border-r border-border-card hidden lg:flex flex-col z-40">
      <div className="px-5 py-5 border-b border-border-card">
        <h1 className="text-base font-body-bold text-primary">
          DealerNode
        </h1>
        <p className="text-exs text-subtle font-body-medium">Helpdesk</p>
      </div>

      <nav className="flex flex-col px-3 py-4 gap-y-1 flex-1 overflow-auto">
        {mainNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={linkClass(isActive(item.path))}
          >
            {item.label}
          </Link>
        ))}

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

        {user?.isSystemAdmin && (
          <>
            <div className="border-t border-border-card my-3" />
            <p className="px-3 text-exs text-subtle font-body-medium uppercase mb-1">
              {t("sidebar.system")}
            </p>
            <Link
              to="/dashboard/admin"
              className={linkClass(isActive("/dashboard/admin"))}
            >
              {t("sidebar.administration")}
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
