import useUser from "@modules/user/hooks/useUser";
import useTheme from "@modules/app/hooks/useTheme";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { updateTheme } from "@modules/user/services/auth.service";

export default function Navbar() {
  const { user, setUser, signOut } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    toggleTheme();
    if (user) {
      updateTheme(next);
      setUser({ ...user, theme: next });
    }
  };

  return (
    <header className="w-full border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 md:px-8">
      <div className="flex items-center justify-between h-14 max-w-[1200px] mx-auto">
        <div />

        <div className="flex items-center gap-x-3">
          {user && (
            <span className="text-sm text-gray-600 dark:text-gray-300 font-body-medium">
              {user.firstName} {user.lastName}
            </span>
          )}
          <button
            onClick={handleToggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-button border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer text-gray-600 dark:text-gray-300"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Button size="xs" color="light" onClick={signOut}>
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </header>
  );
}
