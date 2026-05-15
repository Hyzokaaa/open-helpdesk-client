import { useEffect, useState } from "react";
import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import useInView from "../../hooks/useInView";
import clsx from "clsx";

export default function ProductShowcase() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { ref, inView } = useInView();

  useEffect(() => {
    const img = new Image();
    img.src = "/screenshots/showcase-dark.png";
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-primary-50">
      <Container className="relative z-10">
        <SectionHeading title={t("showcase.heading")} subtitle={t("showcase.subheading")} />

        {/* Theme toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-primary-100 rounded-full p-1">
            <button
              onClick={() => setTheme("light")}
              className={clsx(
                "px-4 py-1.5 text-sm font-body-medium rounded-full transition-all cursor-pointer",
                theme === "light" ? "bg-white text-heading shadow-sm" : "text-muted hover:text-heading",
              )}
            >
              {t("showcase.lightTheme")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={clsx(
                "px-4 py-1.5 text-sm font-body-medium rounded-full transition-all cursor-pointer",
                theme === "dark" ? "bg-white text-heading shadow-sm" : "text-muted hover:text-heading",
              )}
            >
              {t("showcase.darkTheme")}
            </button>
          </div>
        </div>

        {/* Browser frame */}
        <div
          ref={ref}
          className={clsx(
            "max-w-4xl mx-auto rounded-2xl border border-primary-200 overflow-hidden shadow-lg animate-fade-up",
            inView && "in-view",
          )}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-primary-200 bg-white">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-primary-50 rounded-lg px-3 py-1 text-xs text-muted text-center">
                app.openhelpdesk.dev
              </div>
            </div>
          </div>
          <img
            src={theme === "light" ? "/screenshots/showcase-light.png" : "/screenshots/showcase-dark.png"}
            alt={CONFIG.PRODUCT_NAME}
            className="w-full"
          />
        </div>
      </Container>
    </section>
  );
}
