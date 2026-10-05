import { NavLink } from "react-router";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { GUIDES } from "../guides";
import { DOCS_ROUTES } from "../domain/docs-routes";
import type { OperationGroup } from "../domain/operations";
import MethodBadge from "./MethodBadge";

interface Props {
  groups: OperationGroup[];
  loading: boolean;
  error: string | null;
  mobileOpen: boolean;
  onClose: () => void;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
    isActive ? "bg-primary/10 text-primary font-body-medium" : "text-secondary-text hover:bg-surface-hover hover:text-heading",
  );

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pt-4 pb-1.5 text-xs font-body-semibold text-subtle uppercase tracking-wide">{children}</p>;
}

export default function DocsSidebar({ groups, loading, error, mobileOpen, onClose }: Props) {
  const { t } = useTranslation();

  const nav = (
    <nav className="px-2 pb-8" aria-label={t("apiDocs.title")}>
      <SectionTitle>{t("apiDocs.guides")}</SectionTitle>
      {GUIDES.map((guide) => (
        <NavLink key={guide.slug} to={DOCS_ROUTES.guide(guide.slug)} end className={linkClass} onClick={onClose}>
          {t(guide.titleKey)}
        </NavLink>
      ))}

      <SectionTitle>{t("apiDocs.reference")}</SectionTitle>
      {loading && (
        <div className="px-3 py-2"><Spinner /></div>
      )}
      {!loading && error && <p className="px-3 py-1 text-xs text-muted">{t("apiDocs.loadError")}</p>}
      {groups.map((group) => (
        <div key={group.tag} className="mb-2">
          <p className="px-3 pt-2 pb-1 text-xs font-body-semibold text-heading">{group.tag}</p>
          {group.operations.map((op) => (
            <NavLink key={op.slug} to={DOCS_ROUTES.operation(op.slug)} className={linkClass} onClick={onClose}>
              <MethodBadge method={op.method} size="sm" />
              <span className="truncate">{op.operation.summary ?? op.path}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-border-card sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto">
        {nav}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-dvh w-72 max-w-[85vw] bg-surface border-r border-border-card overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border-card">
              <span className="text-sm font-body-bold text-heading">{t("apiDocs.title")}</span>
              <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted hover:text-heading cursor-pointer" aria-label={t("apiDocs.closeMenu")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
