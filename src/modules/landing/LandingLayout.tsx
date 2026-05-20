import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { LanguageProvider } from "./i18n/LanguageContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ForceLightTheme() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-theme");
    html.setAttribute("data-theme", "light");
    html.classList.remove("dark");
    return () => {
      if (prev) html.setAttribute("data-theme", prev);
      else html.removeAttribute("data-theme");
    };
  }, []);
  return null;
}

export default function LandingLayout() {
  return (
    <LanguageProvider>
      <ForceLightTheme />
      <ScrollToTop />
      <Outlet />
    </LanguageProvider>
  );
}
