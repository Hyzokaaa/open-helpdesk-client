import useUser from "@modules/user/hooks/useUser";
import useTheme from "@modules/app/hooks/useTheme";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { updateTheme } from "@modules/user/services/auth.service";

export default function Navbar() {
  const { user, setUser, signOut } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = theme === "dark" || theme === "dark-deep";

  const handleToggleTheme = () => {
    const next = isDark ? "light" : "dark";
    toggleTheme();
    if (user) {
      updateTheme(next);
      setUser({ ...user, theme: next });
    }
  };

  return (
    <header className="w-full border-b border-border-card bg-surface px-6 md:px-8">
      <div className="flex items-center justify-between h-14 max-w-[1200px] mx-auto">
        <div />

        <div className="flex items-center gap-x-3">
          {user && (
            <span className="text-sm text-secondary-text font-body-medium">
              {user.firstName} {user.lastName}
            </span>
          )}
          <button
            onClick={handleToggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-button border border-border-input bg-surface hover:bg-surface-hover transition-all duration-300 cursor-pointer text-muted hover:text-body"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300"
            >
              {isDark ? (
                <>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </>
              ) : (
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              )}
            </svg>
          </button>
          <Button size="xs" color="light" onClick={signOut}>
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
