import { useEffect, useState } from "react";
import clsx from "clsx";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getPlans, getSubscription, checkout, type Plan } from "@modules/billing/services/billing.service";

interface Props {
  defaultPlan: string;
  onDone: () => void;
}

export default function StepPlan({ defaultPlan, onDone }: Props) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState(defaultPlan || "free");
  const [billing, setBilling] = useState<"left" | "right">("left");
  const yearly = billing === "right";
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p.filter((plan) => plan.id !== "enterprise"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return t("billing.free");
    const price = yearly ? plan.priceYearly / 12 : plan.priceMonthly;
    return `$${(price / 100).toFixed(0)}`;
  };

  const handleContinue = async () => {
    if (selected === "free") {
      onDone();
      return;
    }

    setCheckoutLoading(true);
    try {
      const billingCycle = yearly ? "yearly" : "monthly";
      const result = await checkout({ planId: selected, billingCycle });
      window.open(result.paymentUrl, "_blank");
      setWaitingPayment(true);
    } catch {
      toast.error(t("billing.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const sub = await getSubscription();
      if (sub && sub.planId !== "free" && sub.status === "active") {
        onDone();
      } else {
        toast.warning(t("onboarding.paymentNotConfirmed"));
      }
    } catch {
      toast.error(t("onboarding.checkError"));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-lg font-body-bold text-heading mb-1">{t("onboarding.choosePlan")}</h2>
        <p className="text-sm text-muted">{t("onboarding.choosePlanDesc")}</p>
      </div>

      <div className="flex justify-center mb-6">
        <Toggle
          left={t("billing.monthly")}
          right={t("billing.yearly")}
          active={billing}
          onChange={setBilling}
          badge={yearly ? t("billing.yearlyDiscount") : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={clsx(
              "w-full text-left rounded-card border p-4 transition-all cursor-pointer",
              selected === plan.id
                ? "border-primary bg-primary-100/30 dark:bg-primary-950/30"
                : "border-border-card bg-surface hover:border-primary/50",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-body-bold text-heading">{plan.name}</span>
                {plan.popular && (
                  <span className="ml-2 text-exs bg-primary-600 text-white px-1.5 py-0.5 rounded">
                    {t("billing.popular")}
                  </span>
                )}
              </div>
              <span className="text-sm font-body-bold text-heading">
                {formatPrice(plan)}
                {plan.priceMonthly > 0 && <span className="text-muted font-normal">{t("billing.mo")}</span>}
              </span>
            </div>
            <div className="text-xs text-muted mt-1">
              {plan.limits.maxWorkspaces === -1 ? t("billing.unlimited") : plan.limits.maxWorkspaces} {t("billing.workspaces").toLowerCase()}
              {" · "}
              {plan.limits.maxAgentsPerWorkspace === -1 ? t("billing.unlimited") : plan.limits.maxAgentsPerWorkspace} {t("billing.agents").toLowerCase()}
            </div>
          </button>
        ))}
      </div>

      {waitingPayment ? (
        <div className="flex flex-col gap-2">
          <Button full onClick={handleVerifyPayment} loading={verifying}>
            {t("onboarding.alreadyPaid")}
          </Button>
          <Button full color="light" onClick={() => onDone()}>
            {t("onboarding.continueWithFree")}
          </Button>
        </div>
      ) : (
        <Button full onClick={handleContinue} loading={checkoutLoading}>
          {selected === "free" ? t("onboarding.continue") : t("onboarding.continueToPayment")}
        </Button>
      )}
    </div>
  );
}
