import { Navigate, useParams } from "react-router";
import useTranslation from "../i18n/useTranslation";
import usePageMeta from "../hooks/usePageMeta";
import { COMPETITORS } from "../data/competitors";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CompareHero from "../components/sections/CompareHero";
import AtAGlance from "../components/sections/AtAGlance";
import CompareTable from "../components/sections/CompareTable";
import Differentiators from "../components/sections/Differentiators";
import PricingCompare from "../components/sections/PricingCompare";
import CompareFAQ from "../components/sections/CompareFAQ";
import CTAFooter from "../components/sections/CTAFooter";

export default function ComparePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const competitor = slug ? COMPETITORS[slug] : undefined;

  usePageMeta({
    title: competitor ? t(competitor.titleKey) : "",
    description: competitor ? t(competitor.descriptionKey) : "",
    canonical: competitor ? `https://openhelpdesk.dev/compare/${competitor.slug}` : undefined,
  });

  if (!competitor) {
    return <Navigate to="/compare" replace />;
  }

  return (
    <div className="min-h-dvh bg-page">
      <Navbar />
      <CompareHero competitor={competitor} />
      <AtAGlance competitor={competitor} />
      <CompareTable competitor={competitor} />
      <Differentiators competitor={competitor} />
      <PricingCompare competitor={competitor} />
      <CompareFAQ competitor={competitor} />
      <CTAFooter />
      <Footer />
    </div>
  );
}
