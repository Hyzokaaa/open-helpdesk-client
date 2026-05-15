import { useState } from "react";
import clsx from "clsx";
import useTranslation from "../../i18n/useTranslation";
import { CONFIG } from "../../config";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Toggle from "../ui/Toggle";
import PricingCard from "../ui/PricingCard";

export default function Pricing() {
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
      features: [t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3"), t("pricing.free.f4"), t("pricing.free.f5")],
    },
    {
      name: t("pricing.starter.name"),
      description: t("pricing.starter.desc"),
      monthly: 15,
      cta: disablePaid ? t("pricing.comingSoon") : t("pricing.starter.cta"),
      href: CONFIG.APP_URL + "?plan=starter",
      disabled: disablePaid,
      features: [t("pricing.starter.f1"), t("pricing.starter.f2"), t("pricing.starter.f3"), t("pricing.starter.f4"), t("pricing.starter.f5")],
    },
    {
      name: t("pricing.business.name"),
      description: t("pricing.business.desc"),
      monthly: 39,
      cta: disablePaid ? t("pricing.comingSoon") : t("pricing.business.cta"),
      href: CONFIG.APP_URL + "?plan=business",
      disabled: disablePaid,
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

  return (
    <section id="pricing" className="py-24 bg-page">
      <Container>
        <SectionHeading title={t("pricing.heading")} subtitle={t("pricing.subheading")} />

        <div className="flex flex-col items-center gap-1.5 mb-6">
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
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
