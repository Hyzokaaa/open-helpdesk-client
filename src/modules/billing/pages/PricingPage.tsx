import { useEffect, useState } from "react";
import clsx from "clsx";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getPlans, getSubscription, type Plan, type Subscription } from "../services/billing.service";

export default function PricingPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlans(), getSubscription()])
      .then(([p, s]) => { setPlans(p); setSubscription(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  const formatLimit = (value: number) =>
    value === -1 ? t("billing.unlimited") : String(value);

  const formatPrice = (plan: Plan) => {
    if (plan.id === "enterprise") return "";
    if (plan.priceMonthly === 0) return t("billing.free");
    const price = yearly ? plan.priceYearly / 12 : plan.priceMonthly;
    return `$${(price / 100).toFixed(0)}`;
  };

  const isCurrent = (planId: string) => subscription?.planId === planId;
  const isEnterprise = (planId: string) => planId === "enterprise";

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-lg font-body-bold text-heading">{t("billing.pricing")}</h2>
        <p className="text-sm text-muted mt-1">{t("billing.pricingSubtitle")}</p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <span className={clsx("text-sm font-body-medium", !yearly ? "text-heading" : "text-muted")}>
          {t("billing.monthly")}
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={clsx(
            "relative w-11 h-6 rounded-full transition-colors",
            yearly ? "bg-primary" : "bg-gray-300 dark:bg-gray-600",
          )}
        >
          <span className={clsx(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
            yearly ? "translate-x-5.5" : "translate-x-0.5",
          )} />
        </button>
        <span className={clsx("text-sm font-body-medium", yearly ? "text-heading" : "text-muted")}>
          {t("billing.yearly")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={clsx(
              "rounded-card border p-5 flex flex-col relative",
              isCurrent(plan.id)
                ? "border-primary bg-primary-100/30 dark:bg-primary-950/30"
                : plan.popular
                  ? "border-primary"
                  : "border-border-card bg-surface",
            )}
          >
            {plan.popular && !isCurrent(plan.id) && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-exs font-body-semibold px-2 py-0.5 rounded">
                {t("billing.popular")}
              </span>
            )}

            <h3 className="text-base font-body-bold text-heading">{plan.name}</h3>

            <div className="mt-3 mb-4">
              {isEnterprise(plan.id) ? (
                <p className="text-sm text-muted">{t("billing.contactUs")}</p>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-body-bold text-heading">{formatPrice(plan)}</span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm text-muted">{t("billing.mo")}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm text-secondary-text mb-6 flex-1">
              <div className="flex justify-between">
                <span>{t("billing.workspaces")}</span>
                <span className="font-body-semibold text-heading">{formatLimit(plan.limits.maxWorkspaces)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("billing.agents")}</span>
                <span className="font-body-semibold text-heading">{formatLimit(plan.limits.maxAgentsPerWorkspace)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("billing.tickets")}</span>
                <span className="font-body-semibold text-heading">{formatLimit(plan.limits.maxTicketsPerMonth)}</span>
              </div>
            </div>

            {isCurrent(plan.id) ? (
              <Button size="sm" color="light" disabled>{t("billing.current")}</Button>
            ) : isEnterprise(plan.id) ? (
              <Button size="sm" color="light">{t("billing.contactUs")}</Button>
            ) : plan.priceMonthly > 0 ? (
              <Button size="sm" color="primary-light" disabled>{t("billing.comingSoon")}</Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
