import { Link, useLocation, useParams } from "react-router";
import clsx from "clsx";
import useUser from "@modules/user/hooks/useUser";

interface NavItem {
  label: string;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const { workspaceSlug } = useParams();
  const { user } = useUser();

  const mainNav: NavItem[] = [
    { label: "Workspaces", path: "/dashboard/workspaces" },
  ];

  const workspaceNav: NavItem[] = workspaceSlug
    ? [
        { label: "Tickets", path: `/dashboard/workspaces/${workspaceSlug}/tickets` },
        { label: "Members", path: `/dashboard/workspaces/${workspaceSlug}/members` },
        { label: "Tags", path: `/dashboard/workspaces/${workspaceSlug}/tags` },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-dvh w-[240px] bg-white border-r border-gray-100 hidden lg:flex flex-col z-40">
      <div className="px-5 py-5 border-b border-gray-100">
        <h1 className="text-base font-body-bold text-primary">
          DealerNode
        </h1>
        <p className="text-exs text-gray-400 font-body-medium">Helpdesk</p>
      </div>

      <nav className="flex flex-col px-3 py-4 gap-y-1 flex-1 overflow-auto">
        {mainNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              "px-3 py-2 rounded-lg text-sm font-body-medium transition-colors",
              isActive(item.path)
                ? "bg-primary-50 text-primary"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            {item.label}
          </Link>
        ))}

        {workspaceNav.length > 0 && (
          <>
            <div className="border-t border-gray-100 my-3" />
            <p className="px-3 text-exs text-gray-400 font-body-medium uppercase mb-1">
              Workspace
            </p>
            {workspaceNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-body-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary-50 text-primary"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}

        {user?.isSystemAdmin && (
          <>
            <div className="border-t border-gray-100 my-3" />
            <p className="px-3 text-exs text-gray-400 font-body-medium uppercase mb-1">
              System
            </p>
            <Link
              to="/dashboard/admin"
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-body-medium transition-colors",
                isActive("/dashboard/admin")
                  ? "bg-primary-50 text-primary"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              Administration
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
