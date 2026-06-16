import { useState } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import useTranslation from "../i18n/useTranslation";
import { CONFIG } from "../config";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import CTAFooter from "../components/sections/CTAFooter";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import Toggle from "../components/ui/Toggle";
import PricingCard from "../components/ui/PricingCard";
import Accordion from "../components/ui/Accordion";

function Check() {
  return (
    <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Dash() {
  return (
    <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

export default function PricingPage() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"left" | "right">("left");
  const yearly = billing === "right";
  const disablePaid = CONFIG.DISABLE_PAID_PLANS;

  const tiers = [
    {
      name: t("pricing.free.name"),
      description: t("pricing.free.desc"),
      monthly: 0,
      cta: t("pricing.free.cta"),
      href: CONFIG.APP_URL,
      features: [t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3"), t("pricing.free.f4"), t("pricing.free.f5"), t("pricing.free.f6")],
    },
    {
      name: t("pricing.starter.name"),
      description: t("pricing.starter.desc"),
      monthly: 15,
      cta: disablePaid ? t("pricing.comingSoon") : t("pricing.starter.cta"),
      href: CONFIG.APP_URL + "?plan=starter",
      disabled: disablePaid,
      ctaSubtitle: disablePaid ? undefined : t("pricing.starter.trial"),
      features: [t("pricing.starter.f1"), t("pricing.starter.f2"), t("pricing.starter.f3"), t("pricing.starter.f4"), t("pricing.starter.f5"), t("pricing.starter.f6"), t("pricing.starter.f7")],
    },
    {
      name: t("pricing.business.name"),
      description: t("pricing.business.desc"),
      monthly: 39,
      cta: disablePaid ? t("pricing.comingSoon") : t("pricing.business.cta"),
      href: CONFIG.APP_URL + "?plan=business",
      disabled: disablePaid,
      ctaSubtitle: disablePaid ? undefined : t("pricing.business.trial"),
      highlighted: true,
      badge: t("mostPopular"),
      features: [t("pricing.business.f1"), t("pricing.business.f2"), t("pricing.business.f3"), t("pricing.business.f4")],
    },
    {
      name: t("pricing.enterprise.name"),
      description: t("pricing.enterprise.desc"),
      monthly: -1,
      cta: t("pricing.enterprise.cta"),
      href: `mailto:${CONFIG.CONTACT_EMAIL}`,
      features: [t("pricing.enterprise.f1"), t("pricing.enterprise.f2"), t("pricing.enterprise.f3"), t("pricing.enterprise.f4")],
    },
  ];

  const formatPrice = (monthly: number) => {
    if (monthly === 0) return "$0";
    if (monthly === -1) return t("custom");
    return yearly ? `$${monthly * 10}` : `$${monthly}`;
  };

  const formatPeriod = (monthly: number) => {
    if (monthly <= 0) return "";
    return yearly ? t("pricing.perYear") : t("pricing.perMonth");
  };

  const compareRows: { label: string; us: React.ReactNode; them: React.ReactNode }[] = [
    { label: t("pricingPage.compare.startingPrice"), us: <span className="font-body-bold text-primary">{t("pricingPage.compare.startingPriceUs")}</span>, them: <span className="text-muted">{t("pricingPage.compare.startingPriceThem")}</span> },
    { label: t("pricingPage.compare.openSource"), us: <Check />, them: <Cross /> },
    { label: t("pricingPage.compare.selfHosted"), us: <Check />, them: <Dash /> },
    { label: t("pricingPage.compare.unlimitedTickets"), us: <Check />, them: <Check /> },
    { label: t("pricingPage.compare.noPerTicketFees"), us: <Check />, them: <Dash /> },
    { label: t("pricingPage.compare.multiWorkspace"), us: <span className="text-primary text-sm font-body-medium">{t("pricingPage.compare.fromStarter")}</span>, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.reports"), us: <Check />, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.csat"), us: <span className="text-primary text-sm font-body-medium">{t("pricingPage.compare.fromStarter")}</span>, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.customFields"), us: <Check />, them: <span className="text-muted text-sm">{t("pricingPage.compare.limited")}</span> },
    { label: t("pricingPage.compare.cannedResponses"), us: <span className="text-primary text-sm font-body-medium">{t("pricingPage.compare.fromStarter")}</span>, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.emailToTicket"), us: <Check />, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.customerPortal"), us: <Check />, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.sla"), us: <span className="text-primary text-sm font-body-medium">{t("pricingPage.compare.fromStarter")}</span>, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
    { label: t("pricingPage.compare.auditLog"), us: <span className="text-primary text-sm font-body-medium">{t("pricingPage.compare.fromBusiness")}</span>, them: <span className="text-muted text-sm">{t("pricingPage.compare.paidOnly")}</span> },
  ];

  const faqItems = [
    { q: t("pricingPage.faq.q1"), a: t("pricingPage.faq.a1") },
    { q: t("pricingPage.faq.q2"), a: t("pricingPage.faq.a2") },
    { q: t("pricingPage.faq.q3"), a: t("pricingPage.faq.a3") },
    { q: t("pricingPage.faq.q4"), a: t("pricingPage.faq.a4") },
    { q: t("pricingPage.faq.q5"), a: t("pricingPage.faq.a5") },
  ];

  return (
    <div className="min-h-dvh bg-page">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16">
        <Container className="text-center">
          <Link to="/" className="text-sm text-primary hover:underline font-body-medium">
            &larr; {t("legal.backToHome")}
          </Link>
          <h1 className="text-4xl md:text-5xl font-body-bold text-heading tracking-tight mt-6 mb-4 max-w-3xl mx-auto">
            {t("pricingPage.headline")}
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            {t("pricingPage.subheadline")}
          </p>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <Container>
          <div className="flex flex-col items-center gap-1.5 mb-10">
            <Toggle
              left={t("pricing.monthly")}
              right={t("pricing.yearly")}
              active={billing}
              onChange={setBilling}
            />
            <span className={clsx(
              "text-xs font-body-semibold text-primary bg-primary-100 px-2.5 py-1 rounded-full transition-opacity duration-300",
              billing === "right" ? "opacity-100" : "opacity-0",
            )}>
              {t("pricing.yearlyDiscount")}
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <PricingCard
                key={tier.name}
                name={tier.name}
                description={tier.description}
                price={formatPrice(tier.monthly)}
                period={formatPeriod(tier.monthly)}
                features={tier.features}
                cta={tier.cta}
                href={tier.href}
                disabled={tier.disabled}
                highlighted={tier.highlighted}
                badge={tier.badge}
                ctaSubtitle={(tier as any).ctaSubtitle}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-gray-50">
        <Container className="max-w-3xl">
          <SectionHeading
            title={t("pricingPage.compare.heading")}
            subtitle={t("pricingPage.compare.subheading")}
          />

          <div className="bg-white rounded-2xl border border-border-input overflow-hidden">
            <div className="grid grid-cols-3 text-sm font-body-bold text-heading bg-gray-50 border-b border-border-input">
              <div className="px-6 py-4">{t("pricingPage.compare.feature")}</div>
              <div className="px-6 py-4 text-center text-primary">{t("pricingPage.compare.openHelpdesk")}</div>
              <div className="px-6 py-4 text-center text-muted">{t("pricingPage.compare.competitors")}</div>
            </div>
            {compareRows.map((row, i) => (
              <div
                key={row.label}
                className={clsx(
                  "grid grid-cols-3 text-sm",
                  i < compareRows.length - 1 && "border-b border-border-input",
                )}
              >
                <div className="px-6 py-4 text-body">{row.label}</div>
                <div className="px-6 py-4 flex justify-center items-center">{row.us}</div>
                <div className="px-6 py-4 flex justify-center items-center">{row.them}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Self-hosted callout */}
      <section className="py-24 bg-page">
        <Container className="max-w-3xl text-center">
          <h2 className="text-3xl font-body-bold text-heading mb-4">
            {t("pricingPage.selfHosted.heading")}
          </h2>
          <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
            {t("pricingPage.selfHosted.desc")}
          </p>
          <a
            href={CONFIG.GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border-input text-heading font-body-semibold hover:border-primary hover:text-primary transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t("pricingPage.selfHosted.cta")}
          </a>
        </Container>
      </section>

      {/* Pricing FAQ */}
      <section className="py-24 bg-gray-50">
        <Container className="max-w-3xl">
          <SectionHeading title={t("pricingPage.faq.heading")} />
          <div>
            {faqItems.map((item) => (
              <Accordion key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </Container>
      </section>

      <CTAFooter />
      <Footer />
    </div>
  );
}
