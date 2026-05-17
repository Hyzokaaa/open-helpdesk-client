import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Tooltip from "@modules/app/modules/ui/components/Tooltip/Tooltip";
import { getPlans, getSubscription, cancelSubscription, reactivateSubscription, type Plan, type Subscription } from "../services/billing.service";
import CheckoutSheet from "../components/CheckoutSheet";

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billing, setBilling] = useState<"left" | "right">("left");
  const yearly = billing === "right";
  const [loading, setLoading] = useState(true);
  const [downgrading, setDowngrading] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const isCanceled = subscription?.status === "canceled";
  const hasPaidPlan = subscription !== null && subscription.planId !== "free";

  const handleDowngrade = async () => {
    setDowngrading(true);
    try {
      await cancelSubscription();
      const updated = await getSubscription();
      setSubscription(updated);
      toast.success(t("billing.downgradeSuccess"));
    } catch {
      toast.error(t("billing.downgradeError"));
    } finally {
      setDowngrading(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await reactivateSubscription();
      const updated = await getSubscription();
      setSubscription(updated);
      toast.success(t("billing.reactivateSuccess"));
    } catch {
      toast.error(t("billing.reactivateError"));
    } finally {
      setReactivating(false);
    }
  };

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
    const formatted = price / 100;
    return `$${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}`;
  };

  const formatCheckoutPrice = (plan: Plan) => {
    const amount = yearly ? plan.priceYearly : plan.priceMonthly;
    const period = yearly ? t("billing.yr") : t("billing.mo");
    return `$${(amount / 100).toFixed(0)}${period}`;
  };

  const isCurrent = (planId: string) => subscription?.planId === planId && subscription?.status !== "canceled";
  const isEnterprise = (planId: string) => planId === "enterprise";

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-lg font-body-bold text-heading">{t("billing.pricing")}</h2>
        <p className="text-sm text-muted mt-1">{t("billing.pricingSubtitle")}</p>
      </div>

      <div className="flex items-center mb-8">
        <Toggle
          left={t("billing.monthly")}
          right={t("billing.yearly")}
          active={billing}
          onChange={setBilling}
          badge={yearly ? t("billing.yearlyDiscount") : undefined}
        />
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
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-on-primary text-exs font-body-semibold px-2 py-0.5 rounded">
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

            {isCanceled && subscription?.planId === plan.id ? (
              <span className="flex items-center gap-1.5">
                <Button size="sm" color="primary" loading={reactivating} onClick={handleReactivate}>
                  {t("billing.reactivate")}
                </Button>
                <Tooltip text={t("billing.tooltipReactivate")} />
              </span>
            ) : isCurrent(plan.id) ? (
              <Button size="sm" color="light" disabled>{t("billing.current")}</Button>
            ) : isEnterprise(plan.id) ? (
              <Button size="sm" color="light">{t("billing.contactUs")}</Button>
            ) : plan.priceMonthly === 0 && hasPaidPlan && !isEnterprise(plan.id) ? (
              <Button
                size="sm"
                color="danger"
                disabled={downgrading}
                onClick={() => setShowDowngradeConfirm(true)}
              >
                {downgrading ? t("billing.processing") : t("billing.downgrade")}
              </Button>
            ) : plan.priceMonthly > 0 ? (
              <Button
                size="sm"
                color="primary"
                onClick={() => setCheckoutPlan(plan)}
              >
                {t("billing.upgrade")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {showDowngradeConfirm && (
        <ConfirmModal
          title={t("billing.cancelConfirmTitle")}
          message={t("billing.cancelConfirmMessage")}
          confirmLabel={t("billing.downgrade")}
          cancelLabel={t("common.cancel")}
          danger
          onConfirm={() => { setShowDowngradeConfirm(false); handleDowngrade(); }}
          onCancel={() => setShowDowngradeConfirm(false)}
        />
      )}

      {checkoutPlan && (
        <CheckoutSheet
          planName={checkoutPlan.name}
          planId={checkoutPlan.id}
          price={formatCheckoutPrice(checkoutPlan)}
          billingCycle={yearly ? "yearly" : "monthly"}
          onClose={() => setCheckoutPlan(null)}
          onPaddleComplete={() => navigate("/dashboard/settings/billing/success")}
          onTropiPayRedirect={(url) => { window.location.href = url; }}
        />
      )}
    </div>
  );
}
