import { useCallback, useEffect, useState } from "react";
import { Theme, ThemeContext } from "./theme-context";

const STORAGE_KEY = "theme";
const THEME_CLASSES: Theme[] = ["light-border", "dark", "dark-deep"];

function resolveTheme(value: string): Theme {
  if (value === "dark" || value === "dark-deep" || value === "light" || value === "light-border") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return resolveTheme(stored ?? "system");
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
  if (theme !== "light") {
    root.classList.add(theme);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) =>
      prev === "light" || prev === "light-border" ? "dark" : "light",
    );
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
