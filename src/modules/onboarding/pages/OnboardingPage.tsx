import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { APP_FULL_NAME } from "@modules/app/domain/constants/env";
import StepAccount from "../components/StepAccount";
import StepVerifyEmail from "../components/StepVerifyEmail";
import StepWorkspace from "../components/StepWorkspace";

const CORE_STEPS = ["account", "verify", "workspace"];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "";

  const { onboardingSteps, renderOnboardingStep } = useExtensions();
  const steps = onboardingSteps ?? CORE_STEPS;

  const [step, setStep] = useState<string>(steps[0]);
  const [loading, setLoading] = useState(true);

  const isNewSignup = useRef(false);

  useEffect(() => {
    detectStep();
  }, [user]);

  const detectStep = () => {
    if (!user) {
      setStep(steps[0]);
      setLoading(false);
      return;
    }

    if (!isNewSignup.current && user.isEmailVerified) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!user.isEmailVerified) {
      setStep("verify");
      setLoading(false);
      return;
    }

    // Go to the step after "verify"
    const verifyIndex = steps.indexOf("verify");
    setStep(steps[verifyIndex + 1] ?? steps[steps.length - 1]);
    setLoading(false);
  };

  const stepIndex = steps.indexOf(step);
  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
    else navigate("/dashboard");
  };
  const handleAccountDone = () => { isNewSignup.current = true; setStep("verify"); };
  const handleFinish = () => navigate("/dashboard");

  if (loading) return null;

  const renderStep = () => {
    if (step === "account") return <StepAccount onDone={handleAccountDone} />;
    if (step === "verify") return <StepVerifyEmail onDone={goNext} />;
    if (step === "workspace") return <StepWorkspace onDone={handleFinish} onSkip={handleFinish} />;
    if (renderOnboardingStep) {
      return renderOnboardingStep(step, { defaultPlan: planFromUrl, onDone: goNext });
    }
    return null;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-page">
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-xl font-body-bold text-heading mb-8">{APP_FULL_NAME}</h1>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
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
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-primary-600" : "bg-surface-hover"}`} />
              )}
            </div>
          ))}
        </div>

        <div className={`w-full ${step === "plan" ? "max-w-3xl" : "max-w-md"}`}>
          {renderStep()}
        </div>

        <div className="flex items-center justify-center gap-3 mt-8 text-[11px] text-muted">
          <a href="/terms" className="hover:text-heading transition-colors">{t("legal.terms")}</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-heading transition-colors">{t("legal.privacy")}</a>
          <span>·</span>
          <a href="/refund" className="hover:text-heading transition-colors">{t("legal.refund")}</a>
        </div>
      </div>
    </div>
  );
}
