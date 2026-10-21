import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import UserAvatar from "@modules/user/components/UserAvatar";
import NotificationBell from "@modules/notification/components/NotificationBell";
import useTranslation from "@modules/app/i18n/useTranslation";
import { useLeaveGuard } from "@modules/app/hooks/useUnsavedChanges";
import NavIcon, { NavIconName } from "./nav-icons";

interface Props {
  onMenuToggle?: () => void;
  /** Whether the phone menu is open, for screen readers. */
  drawerOpen?: boolean;
}

export default function Navbar({ onMenuToggle, drawerOpen = false }: Props) {
  const { user, signOut } = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirmLeave = useLeaveGuard();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header className="w-full border-b border-border-card bg-surface px-6 md:px-8">
      <div className="flex items-center justify-between h-14 max-w-[1200px] mx-auto">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={t("nav.openMenu")}
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
          className="lg:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="w-5 h-0.5 bg-heading" />
          <span className="w-5 h-0.5 bg-heading" />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-x-3">
          <NotificationBell />
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <UserAvatar avatarUrl={user?.avatarUrl} firstName={user?.firstName} lastName={user?.lastName} size="md" />
              <span className="text-sm text-secondary-text font-body-medium hidden sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted hidden sm:inline">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border-card rounded-lg shadow-lg z-50 py-1">
                <p className="px-4 py-1.5 text-exs uppercase tracking-[.06em] font-body-semibold text-muted">{t("nav.userSettings")}</p>
                {([
                  { label: t("settings.account"), path: "/dashboard/settings/account", icon: "account" },
                  { label: t("settings.security"), path: "/dashboard/settings/security", icon: "security" },
                  { label: t("settings.preferences"), path: "/dashboard/settings/preferences", icon: "preferences" },
                  { label: t("notifications.preferences"), path: "/dashboard/settings/notifications", icon: "notifications" },
                ] as { label: string; path: string; icon: NavIconName }[]).map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { setMenuOpen(false); confirmLeave(() => navigate(item.path)); }}
                    className="group w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm text-body hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <span className="flex text-muted group-hover:text-secondary-text"><NavIcon name={item.icon} /></span>
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border-card my-1" />
                <button
                  onClick={() => { setMenuOpen(false); confirmLeave(() => signOut()); }}
                  className="w-full flex items-center gap-2.5 text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <span className="flex"><NavIcon name="signOut" /></span>
                  {t("nav.signOut")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
