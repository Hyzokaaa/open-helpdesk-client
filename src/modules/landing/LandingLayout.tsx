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

export default function LandingLayout() {
  return (
    <LanguageProvider>
      <ScrollToTop />
      <Outlet />
    </LanguageProvider>
  );
}
