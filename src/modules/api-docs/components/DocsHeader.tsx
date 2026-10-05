import { Link } from "react-router";
import useConfig from "@modules/app/hooks/useConfig";
import useTheme from "@modules/app/hooks/useTheme";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUser from "@modules/user/hooks/useUser";
import LanguageToggle from "@modules/app/components/LanguageToggle";
import { DOCS_ROUTES } from "../domain/docs-routes";

interface Props {
  onMenuToggle: () => void;
}

const ICON_BUTTON =
  "w-8 h-8 flex items-center justify-center rounded-button border border-border-input bg-surface hover:bg-surface-hover transition-all duration-300 cursor-pointer text-muted hover:text-body";

export default function DocsHeader({ onMenuToggle }: Props) {
  const { t } = useTranslation();
  const { brandName, brandSubtitle, brandLogo, brandIcon } = useConfig();
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const isDark = theme.startsWith("dark");

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border-card bg-surface/95 backdrop-blur">
      <div className="h-full flex items-center gap-3 px-4 md:px-6">
        <button type="button" onClick={onMenuToggle} className="lg:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer" aria-label={t("apiDocs.menu")}>
          <span className="w-5 h-0.5 bg-heading" />
          <span className="w-5 h-0.5 bg-heading" />
        </button>

        <Link to={DOCS_ROUTES.root} className="flex items-center gap-2.5 min-w-0">
          {(brandIcon || brandLogo) && <img src={brandIcon || brandLogo!} alt="" className="w-7 h-7 object-contain shrink-0 rounded" />}
          <span className="text-base font-body-bold text-primary truncate">
            {brandName}
            {brandSubtitle && <span className="text-heading"> {brandSubtitle}</span>}
          </span>
          <span className="hidden sm:inline pl-2.5 border-l border-border-card text-sm text-subtle font-body-medium truncate">{t("apiDocs.title")}</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <button type="button" onClick={toggleTheme} className={ICON_BUTTON} aria-label={t("apiDocs.toggleTheme")} title={t("apiDocs.toggleTheme")}>
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="ml-1 px-3 py-1.5 rounded-button text-xs font-body-semibold bg-primary-600 hover:bg-primary-700 text-on-primary transition-colors whitespace-nowrap"
          >
            {user ? t("apiDocs.dashboard") : t("apiDocs.signIn")}
          </Link>
        </div>
      </div>
    </header>
  );
}
