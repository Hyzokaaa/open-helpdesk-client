import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getPlans, getSubscription, activatePlan, type Plan } from "@modules/billing/services/billing.service";
import CheckoutSheet from "@modules/billing/components/CheckoutSheet";

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "onboarding.plan.free.f1",
    "onboarding.plan.free.f2",
    "onboarding.plan.free.f3",
    "onboarding.plan.free.f4",
  ],
  starter: [
    "onboarding.plan.starter.f1",
    "onboarding.plan.starter.f2",
    "onboarding.plan.starter.f3",
    "onboarding.plan.starter.f4",
    "onboarding.plan.starter.f5",
  ],
  business: [
    "onboarding.plan.business.f1",
    "onboarding.plan.business.f2",
    "onboarding.plan.business.f3",
    "onboarding.plan.business.f4",
  ],
};

interface Props {
  defaultPlan: string;
  onDone: () => void;
}

export default function StepPlan({ defaultPlan, onDone }: Props) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState(defaultPlan || "starter");
  const [billing, setBilling] = useState<"left" | "right">("left");
  const yearly = billing === "right";
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p.filter((plan) => plan.id !== "enterprise"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (plan: Plan) => {
    if (plan.priceMonthly === 0) return "$0";
    const price = yearly ? plan.priceYearly / 12 : plan.priceMonthly;
    const formatted = price / 100;
    return `$${formatted % 1 === 0 ? formatted.toFixed(0) : formatted.toFixed(2)}`;
  };

  const selectedPlan = plans.find((p) => p.id === selected);

  const formatCheckoutPrice = (plan: Plan) => {
    const amount = yearly ? plan.priceYearly : plan.priceMonthly;
    const period = yearly ? t("billing.yr") : t("billing.mo");
    return `$${(amount / 100).toFixed(0)}${period}`;
  };

  const handleStartTrial = async () => {
    setActivating(true);
    try {
      await activatePlan(selected);
      onDone();
    } catch {
      toast.error(t("onboarding.workspaceError"));
    } finally {
      setActivating(false);
    }
  };

  const handlePayNow = () => {
    setShowCheckout(true);
  };

  const handleContinueFree = async () => {
    setActivating(true);
    try {
      await activatePlan("free");
      onDone();
    } catch {
      toast.error(t("onboarding.workspaceError"));
    } finally {
      setActivating(false);
    }
  };

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!waitingPayment) return;
    pollRef.current = setInterval(async () => {
      try {
        const sub = await getSubscription();
        if (sub && sub.planId !== "free" && sub.status === "active" && sub.source === "payment") {
          if (pollRef.current) clearInterval(pollRef.current);
          onDone();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [waitingPayment, onDone]);

  const handleVerifyPayment = async () => {
    setVerifying(true);
    try {
      const sub = await getSubscription();
      if (sub && sub.planId !== "free" && sub.status === "active" && sub.source === "payment") {
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

  const isPaid = selected !== "free";

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-lg font-body-bold text-heading mb-1">{t("onboarding.choosePlan")}</h2>
        <p className="text-sm text-muted">{t("onboarding.choosePlanDesc")}</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 mb-6">
        <Toggle
          left={t("billing.monthly")}
          right={t("billing.yearly")}
          active={billing}
          onChange={setBilling}
        />
        <span className={clsx(
          "text-xs font-body-semibold text-primary bg-primary-100 dark:bg-primary-950/40 px-2.5 py-1 rounded-full transition-opacity duration-300",
          yearly ? "opacity-100" : "opacity-0",
        )}>
          {t("billing.yearlyDiscount")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          const features = PLAN_FEATURES[plan.id] ?? [];

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={clsx(
                "relative flex flex-col text-left rounded-xl border-2 p-5 transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary-50/50 dark:bg-primary-950/20 shadow-md shadow-primary/10"
                  : "border-border-card bg-surface hover:border-primary/40 hover:shadow-sm",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-exs bg-primary-600 text-white px-2.5 py-0.5 rounded-full font-body-semibold">
                  {t("billing.popular")}
                </span>
              )}

              <div className="mb-3">
                <h3 className="text-base font-body-bold text-heading">{plan.name}</h3>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-body-bold text-heading">{formatPrice(plan)}</span>
                {plan.priceMonthly > 0 && (
                  <span className="text-sm text-muted ml-1">{t("billing.mo")}</span>
                )}
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {features.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-xs text-body">
                    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t(key as any)}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {waitingPayment ? (
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          <Button full onClick={handleVerifyPayment} loading={verifying}>
            {t("onboarding.alreadyPaid")}
          </Button>
          <Button full color="light" onClick={() => onDone()}>
            {t("onboarding.continueWithFree")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          {!isPaid && (
            <Button full onClick={handleContinueFree} loading={activating}>
              {t("onboarding.continueWithFreeShort")}
            </Button>
          )}
          {isPaid && (
            <>
              <Button full onClick={handleStartTrial} loading={activating}>
                {t("onboarding.startTrial")}
              </Button>
              <Button full color="light" onClick={handlePayNow}>
                {t("onboarding.payNow")}
              </Button>
              <p className="text-exs text-muted text-center">{t("onboarding.trialNoCreditCard")}</p>
            </>
          )}
        </div>
      )}

      {showCheckout && selectedPlan && (
        <CheckoutSheet
          planName={selectedPlan.name}
          planId={selectedPlan.id}
          price={formatCheckoutPrice(selectedPlan)}
          billingCycle={yearly ? "yearly" : "monthly"}
          onClose={() => setShowCheckout(false)}
          onPaddleComplete={() => onDone()}
          onTropiPayRedirect={(url) => {
            window.open(url, "_blank");
            setShowCheckout(false);
            setWaitingPayment(true);
          }}
        />
      )}
    </div>
  );
}
