import { Link } from "react-router";
import useTranslation from "../i18n/useTranslation";
import usePageMeta from "../hooks/usePageMeta";
import { COMPETITORS } from "../data/competitors";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CTAFooter from "../components/sections/CTAFooter";
import Container from "../components/ui/Container";

export default function CompareIndexPage() {
  const { t } = useTranslation();

  usePageMeta({
    title: t("compare.index.title"),
    description: t("compare.index.subtitle"),
    canonical: "https://openhelpdesk.dev/compare",
  });

  const competitors = Object.values(COMPETITORS);

  return (
    <div className="min-h-dvh bg-page">
      <Navbar />

      <section className="pt-32 pb-16">
        <Container className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline font-body-medium">
            &larr; {t("legal.backToHome")}
          </Link>
          <h1 className="text-4xl md:text-5xl font-body-bold text-heading tracking-tight mt-6 mb-4 max-w-3xl mx-auto">
            {t("compare.index.headline")}
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            {t("compare.index.subtitle")}
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            {competitors.map((c) => (
              <Link
                key={c.slug}
                to={`/compare/${c.slug}`}
                className="group bg-white rounded-2xl border border-border-input p-8 hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <h2 className="text-2xl font-body-bold text-heading mb-2 group-hover:text-primary transition-colors">
                  vs {t(c.nameKey)}
                </h2>
                <p className="text-muted mb-6 leading-relaxed">
                  {t(c.subtitleKey)}
                </p>
                <span className="inline-flex items-center gap-1 text-primary font-body-semibold text-sm">
                  {t("compare.index.cta")}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CTAFooter />
      <Footer />
    </div>
  );
}
