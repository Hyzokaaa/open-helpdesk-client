import { Link, useLocation, useNavigate } from "react-router";
import { useCallback } from "react";
import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import { GitHubIcon } from "../icons/SocialIcons";

type FooterLink = { label: string; href?: string; to?: string; hash?: string };

export default function Footer() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleHashClick = useCallback(
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

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: t("footer.product"),
      links: [
        { label: t("footer.features"), hash: "#features" },
        { label: t("footer.pricing"), to: "/pricing" },
        { label: "vs Zendesk", to: "/compare/zendesk" },
        { label: "vs osTicket", to: "/compare/osticket" },
      ],
    },
    {
      title: t("footer.resources"),
      links: [
        { label: t("footer.docs"), href: CONFIG.DOCS_URL },
        { label: t("footer.github"), href: CONFIG.GITHUB_URL },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.contact"), href: `mailto:${CONFIG.CONTACT_EMAIL}` },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), to: "/privacy" },
        { label: t("footer.terms"), to: "/terms" },
        { label: t("footer.refund"), to: "/refund" },
        { label: t("footer.license"), href: `${CONFIG.GITHUB_URL}/blob/main/LICENSE` },
      ],
    },
  ];

  return (
    <footer className="bg-primary-950">
      <Container className="py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-body-semibold text-gray-100 text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ) : link.hash ? (
                      <a
                        href={link.hash}
                        onClick={(e) => handleHashClick(e, link.hash!)}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.href ?? "#"}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                        {...(link.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Open Helpdesk" className="w-6 h-6" />
            <span className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Open Helpdesk. {t("footer.rights")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={CONFIG.GITHUB_URL} className="text-gray-400 hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
