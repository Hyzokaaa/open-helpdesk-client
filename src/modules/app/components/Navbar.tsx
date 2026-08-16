import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import NotificationBell from "@modules/notification/components/NotificationBell";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  onMenuToggle?: () => void;
}

export default function Navbar({ onMenuToggle }: Props) {
  const { user, signOut } = useUser();
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const initials = user ? ((user.firstName[0] ?? "") + (user.lastName[0] ?? "")).toUpperCase() || "?" : "?";

  return (
    <header className="w-full border-b border-border-card bg-surface px-6 md:px-8">
      <div className="flex items-center justify-between h-14 max-w-[1200px] mx-auto">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
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
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-sm text-secondary-text font-body-medium hidden sm:inline">
                {user?.firstName} {user?.lastName}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted hidden sm:inline">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-surface border border-border-card rounded-lg shadow-lg z-50 py-1">
                <p className="px-4 py-1.5 text-xs font-body-semibold text-subtle uppercase">{t("nav.userSettings")}</p>
                {[
                  { label: t("settings.account"), path: "/dashboard/settings/account" },
                  { label: t("settings.security"), path: "/dashboard/settings/security" },
                  { label: t("settings.preferences"), path: "/dashboard/settings/preferences" },
                  { label: t("notifications.preferences"), path: "/dashboard/settings/notifications" },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-body hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border-card my-1" />
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-hover transition-colors cursor-pointer"
                >
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
