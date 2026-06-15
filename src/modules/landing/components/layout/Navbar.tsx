import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import clsx from "clsx";
import useTranslation from "../../i18n/useTranslation";
import Container from "../ui/Container";
import Button from "../ui/Button";

export default function Navbar() {
  const { t, lang, toggleLang } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleAnchorClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
      e.preventDefault();
      if (location.pathname !== "/") {
        navigate("/" + hash);
      } else {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [location.pathname, navigate],
  );

  const links: { label: string; href: string }[] = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "/pricing" },
    { label: t("nav.openSource"), href: "#open-source" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-lg border-b border-border-input shadow-sm"
          : "bg-transparent",
      )}
    >
      <Container className="flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Open Helpdesk" className="w-8 h-8" />
          <span className="font-body-bold text-heading text-lg">Open Helpdesk</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-secondary-text hover:text-primary transition-colors font-body-medium"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-sm text-secondary-text hover:text-primary transition-colors font-body-medium"
              >
                {link.label}
              </a>
            ),
          )}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-body-semibold text-muted hover:text-primary px-2 py-1 rounded-lg hover:bg-primary-50 transition-all cursor-pointer"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>
          <a
            href="/login"
            className="text-sm font-body-medium text-secondary-text hover:text-primary transition-colors"
          >
            {t("nav.signIn")}
          </a>
          <Button href="/signup" size="sm">
            {t("nav.getStarted")}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className={clsx("w-5 h-0.5 bg-heading transition-all duration-300", menuOpen && "rotate-45 translate-y-[4px]")} />
          <span className={clsx("w-5 h-0.5 bg-heading transition-all duration-300", menuOpen && "-rotate-45 -translate-y-[4px]")} />
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        className={clsx(
          "md:hidden overflow-hidden transition-all duration-300 bg-white/95 backdrop-blur-lg border-b border-border-input",
          menuOpen ? "max-h-80" : "max-h-0 border-b-0",
        )}
      >
        <Container className="py-4 flex flex-col gap-4">
          {links.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-secondary-text hover:text-primary font-body-medium"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => { handleAnchorClick(e, link.href); setMenuOpen(false); }}
                className="text-sm text-secondary-text hover:text-primary font-body-medium"
              >
                {link.label}
              </a>
            ),
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-border-input">
            <button onClick={toggleLang} className="text-xs font-body-semibold text-muted hover:text-primary cursor-pointer">
              {lang === "en" ? "ES" : "EN"}
            </button>
            <a
              href="/login"
              className="text-sm font-body-medium text-secondary-text hover:text-primary transition-colors"
            >
              {t("nav.signIn")}
            </a>
            <Button href="/signup" size="sm">
              {t("nav.getStarted")}
            </Button>
          </div>
        </Container>
      </div>
    </nav>
  );
}
