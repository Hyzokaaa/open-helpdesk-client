import { useEffect, useState, type ReactNode } from "react";
import usePortalSlug from "../hooks/usePortalSlug";
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
      {children}
    </div>
  );
}
