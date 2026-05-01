import { createContext, useEffect, useRef, useState, ReactNode } from "react";
import { useParams, useLocation } from "react-router";
import { getWorkspace } from "../services/workspace.service";
import { getPalette, DEFAULT_PALETTE, PALETTES, PaletteDefinition } from "../domain/palettes";
import { needsDarkText } from "../domain/color-scale";

interface PaletteContextValue {
  palette: string;
  setPalette: (name: string) => void;
  clearWorkspacePalette: () => void;
}

export const PaletteContext = createContext<PaletteContextValue>({
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
  clearWorkspacePalette: () => {},
});

function applyPalette(def: PaletteDefinition) {
  const root = document.documentElement;
  Object.entries(def.scale).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  root.style.setProperty('--palette-accent-rgb', def.accentRgb);
  const lightPrimary = needsDarkText(def.scale['600']);
  root.style.setProperty('--color-primary-contrast', lightPrimary ? '#1f2937' : '#ffffff');
  root.style.setProperty('--color-primary-badge-bg', lightPrimary ? '#f3f4f6' : def.scale['100']);
  root.style.setProperty('--color-primary-badge-text', lightPrimary ? '#374151' : def.scale['700']);
}

function clearPalette() {
  const root = document.documentElement;
  const defaultDef = PALETTES[DEFAULT_PALETTE];
  Object.keys(defaultDef.scale).forEach((shade) => {
    root.style.removeProperty(`--color-primary-${shade}`);
  });
  root.style.removeProperty('--palette-accent-rgb');
  root.style.removeProperty('--color-primary-contrast');
  root.style.removeProperty('--color-primary-badge-bg');
  root.style.removeProperty('--color-primary-badge-text');
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const { workspaceSlug } = useParams();
  const location = useLocation();
  const [palette, setPaletteState] = useState<string>(DEFAULT_PALETTE);
  const lastSlugRef = useRef<string | null>(null);

  const isHome = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  useEffect(() => {
    if (isHome) {
      lastSlugRef.current = null;
      clearPalette();
      setPaletteState(DEFAULT_PALETTE);
      return;
    }

    const slug = workspaceSlug ?? lastSlugRef.current;

    if (workspaceSlug) {
      lastSlugRef.current = workspaceSlug;
    }

    if (!slug) {
      clearPalette();
      setPaletteState(DEFAULT_PALETTE);
      return;
    }

    getWorkspace(slug).then((ws) => {
      const name = ws.palette ?? DEFAULT_PALETTE;
      setPaletteState(name);
      const def = getPalette(name);
      if (name !== DEFAULT_PALETTE) {
        applyPalette(def);
      } else {
        clearPalette();
      }
    });
  }, [workspaceSlug, isHome]);

  const setPalette = (name: string) => {
    setPaletteState(name);
    const def = getPalette(name);
    if (name !== DEFAULT_PALETTE) {
      applyPalette(def);
    } else {
      clearPalette();
    }
  };

  const clearWorkspacePalette = () => {
    lastSlugRef.current = null;
    clearPalette();
    setPaletteState(DEFAULT_PALETTE);
  };

  return (
    <PaletteContext.Provider value={{ palette, setPalette, clearWorkspacePalette }}>
      {children}
    </PaletteContext.Provider>
  );
}
