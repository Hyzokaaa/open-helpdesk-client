import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import usePortalSlug from "../hooks/usePortalSlug";
import usePortalAccess from "../hooks/usePortalAccess";
import { portalSignInPath } from "../domain/portal-access";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getPortalInfo } from "../services/portal.service";
import {
  getPalette,
  DEFAULT_PALETTE,
  PaletteDefinition,
} from "@modules/workspace/domain/palettes";
import { needsDarkText } from "@modules/workspace/domain/color-scale";

function applyPortalPalette(def: PaletteDefinition) {
  const root = document.documentElement;
  Object.entries(def.scale).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  root.style.setProperty("--palette-accent-rgb", def.accentRgb);
  const lightPrimary = needsDarkText(def.scale["600"]);
  root.style.setProperty("--color-primary-contrast", lightPrimary ? "#1f2937" : "#ffffff");
}

interface Props {
  children: ReactNode;
}

export default function PortalKbLayout({ children }: Props) {
  const { t } = useTranslation();
  const workspaceSlug = usePortalSlug();
  const access = usePortalAccess(workspaceSlug);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    getPortalInfo(workspaceSlug)
      .then((info) => {
        const paletteName = info.palette ?? DEFAULT_PALETTE;
        const def = getPalette(paletteName);
        if (paletteName !== DEFAULT_PALETTE) {
          applyPortalPalette(def);
        }
      })
      .catch(() => setError(true));

    return () => {
      const root = document.documentElement;
      const defaultDef = getPalette(DEFAULT_PALETTE);
      Object.entries(defaultDef.scale).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
      });
      root.style.setProperty("--palette-accent-rgb", defaultDef.accentRgb);
      root.style.setProperty("--color-primary-contrast", "#ffffff");
    };
  }, [workspaceSlug]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-muted mb-3">{t("portalKb.loadError")}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            {t("portalKb.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* With the portal closed the articles are the only public page: the way in is from here */}
      {access && !access.portalEnabled && workspaceSlug && (
        <div className="flex justify-end px-4 pt-4 max-w-3xl mx-auto">
          <Link
            to={portalSignInPath({ workspaceSlug })}
            className="text-sm font-body-semibold px-3 py-1.5 rounded-button border border-border-input bg-surface text-body hover:bg-surface-hover transition-colors"
          >
            {t("login.signIn")}
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
