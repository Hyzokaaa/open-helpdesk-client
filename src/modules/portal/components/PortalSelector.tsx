import { Link } from "react-router";
import type { DomainWorkspace } from "@modules/app/context/config-context";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";

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
        <div className="flex flex-col items-center mb-8">
          {brandLogo && <img src={brandLogo} alt="" className="w-10 h-10 object-contain mb-2" />}
          <h1 className="text-xl font-body-bold text-heading">{brandName}</h1>
          {brandSubtitle && <p className="text-xs text-subtle">{brandSubtitle}</p>}
        </div>

        <p className="text-sm text-muted text-center mb-4">{t("portal.selectWorkspace")}</p>

        <div className="space-y-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.slug}
              to={`/portal/${ws.slug}`}
              className="flex items-center gap-3 p-4 rounded-lg border border-border-card bg-surface hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-body-bold text-primary">{initials(ws.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body-bold text-heading truncate">{ws.name}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-subtle hover:text-primary transition-colors">
            {t("portal.agentLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
