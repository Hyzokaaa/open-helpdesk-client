import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getSubscription } from "@modules/billing/services/billing.service";
import { APP_FULL_NAME } from "@modules/app/domain/constants/env";
import StepAccount from "../components/StepAccount";
import StepVerifyEmail from "../components/StepVerifyEmail";
import StepPlan from "../components/StepPlan";
import StepWorkspace from "../components/StepWorkspace";

const STEPS = ["account", "verify", "plan", "workspace"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "";
  const stepFromUrl = searchParams.get("step");

  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectStep();
  }, [user]);

  const isNewSignup = useRef(false);

  const detectStep = async () => {
    if (!user) {
      setStep("account");
      setLoading(false);
      return;
    }

    // If user was already logged in before reaching onboarding, redirect to dashboard
    if (!isNewSignup.current && user.isEmailVerified) {
      navigate("/dashboard/settings/pricing", { replace: true });
      return;
    }

    if (!user.isEmailVerified) {
      setStep("verify");
      setLoading(false);
      return;
    }

    if (stepFromUrl === "4") {
      setStep("workspace");
      setLoading(false);
      return;
    }

    setStep("plan");
    setLoading(false);
  };

  const stepIndex = STEPS.indexOf(step);

  const handleAccountDone = () => { isNewSignup.current = true; setStep("verify"); };
  const handleVerifyDone = () => setStep("plan");
  const handlePlanDone = () => setStep("workspace");
  const handleFinish = () => navigate("/dashboard");

  if (loading) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center bg-page py-12 px-4">
      <h1 className="text-xl font-body-bold text-heading mb-8">{APP_FULL_NAME}</h1>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body-semibold ${
                i <= stepIndex
                  ? "bg-primary-600 text-white"
                  : "bg-surface-hover text-muted"
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-primary-600" : "bg-surface-hover"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        {step === "account" && <StepAccount onDone={handleAccountDone} />}
        {step === "verify" && <StepVerifyEmail onDone={handleVerifyDone} />}
        {step === "plan" && <StepPlan defaultPlan={planFromUrl} onDone={handlePlanDone} />}
        {step === "workspace" && <StepWorkspace onDone={handleFinish} onSkip={handleFinish} />}
      </div>
    </div>
  );
}
