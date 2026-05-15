import { Link } from "react-router";
import useTranslation from "../i18n/useTranslation";
import type { TranslationKey } from "../i18n/translations";
import { CONFIG } from "../config";
import Container from "../components/ui/Container";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const sections = [
  "eligibility",
  "process",
  "exceptions",
  "downgrade",
  "contact",
] as const;

export default function RefundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-page">
      <Navbar />
      <main className="pt-32 pb-20">
        <Container className="max-w-3xl">
          <Link to="/" className="text-sm text-primary hover:underline font-body-medium">
            &larr; {t("legal.backToHome")}
          </Link>

          <h1 className="text-4xl font-heading text-heading mt-6 mb-2">
            {t("refund.title")}
          </h1>
          <p className="text-sm text-muted mb-12">{t("refund.lastUpdated")}</p>

          <p className="text-body-text leading-relaxed mb-10">{t("refund.intro")}</p>

          {sections.map((key) => (
            <section key={key} className="mb-10">
              <h2 className="text-xl font-body-bold text-heading mb-3">
                {t(`refund.${key}.title` as TranslationKey)}
              </h2>
              <p className="text-body-text leading-relaxed">
                {t(`refund.${key}.desc` as TranslationKey)}
                {key === "contact" && (
                  <>
                    {" "}
                    <a
                      href={`mailto:${CONFIG.CONTACT_EMAIL}`}
                      className="text-primary hover:underline"
                    >
                      {CONFIG.CONTACT_EMAIL}
                    </a>
                  </>
                )}
              </p>
            </section>
          ))}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
