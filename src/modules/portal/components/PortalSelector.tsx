import { Link } from "react-router";
import type { DomainWorkspace } from "@modules/app/context/config-context";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import LanguageToggle from "@modules/app/components/LanguageToggle";
import BrandLogo from "@modules/app/components/BrandLogo";
import { portalAccessOf, portalSignInPath } from "../domain/portal-access";

interface Props {
  workspaces: DomainWorkspace[];
}

export default function PortalSelector({ workspaces }: Props) {
  const { t } = useTranslation();
  const { brandName, brandSubtitle, brandLogo } = useConfig();

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full min-h-dvh flex flex-col items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="relative flex flex-col items-center mb-8">
          <div className="absolute right-0 top-0">
            <LanguageToggle />
          </div>
          {brandLogo && <BrandLogo src={brandLogo} size="lg" className="mb-2" />}
          <h1 className="text-xl font-body-bold text-heading">{brandName}</h1>
          {brandSubtitle && <p className="text-xs text-subtle">{brandSubtitle}</p>}
        </div>

        <p className="text-sm text-muted text-center mb-4">{t("portal.selectWorkspace")}</p>

        <div className="space-y-2">
          {workspaces.map((ws) => {
            // A closed portal stays in the list, marked, and leads to sign-in with its branding
            const open = portalAccessOf(ws).portalEnabled;
            return (
            <Link
              key={ws.slug}
              to={open ? `/portal/${ws.slug}` : portalSignInPath({ workspaceSlug: ws.slug })}
              className="flex items-center gap-3 p-4 rounded-lg border border-border-card bg-surface hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-body-bold text-primary">{initials(ws.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body-bold text-heading truncate">{ws.name}</p>
                {!open && (
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                    {t("portal.signInRequired")}
                  </p>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login?from=portal" className="text-xs text-subtle hover:text-primary transition-colors">
            {t("portal.agentLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
