import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { APP_FULL_NAME } from "@modules/app/domain/constants/env";
import StepAccount from "../components/StepAccount";
import StepVerifyEmail from "../components/StepVerifyEmail";
import StepWorkspace from "../components/StepWorkspace";
import CookiePreferencesLink from "@modules/analytics/components/CookiePreferencesLink";
import { getOnboarding, skipOnboardingStep, type OnboardingState } from "../services/onboarding.service";

/** Creating the account comes first and happens here, before there is anyone to ask about. */
const ACCOUNT = "account";

/**
 * The onboarding. Which steps there are, and which one is next, comes from the backend (each
 * step answers from the account's real state, cloud adds the plan), so this page only shows
 * the next one and asks again after each. Complete, it goes where the person was headed.
 */
export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "";
  const redirect = searchParams.get("redirect");
  const { renderOnboardingStep } = useExtensions();

  const [state, setState] = useState<OnboardingState | null>(null);

  const finish = useCallback(() => {
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard";
    navigate(target, { replace: true });
  }, [navigate, redirect]);

  const apply = useCallback((next: OnboardingState) => {
    if (next.nextStep === null) finish();
    else setState(next);
  }, [finish]);

  // If the onboarding cannot be read, the dashboard asks again rather than leaving a blank page
  const refresh = useCallback(() => { getOnboarding().then(apply).catch(finish); }, [apply, finish]);
  const skip = useCallback((step: string) => { skipOnboardingStep(step).then(apply).catch(() => refresh()); }, [apply, refresh]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setState(null);
      return;
    }
    refresh();
  }, [user?.id, userLoading, refresh]);

  if (userLoading || (user && !state)) return null;

  const step = user && state ? state.nextStep! : ACCOUNT;
  const steps = [ACCOUNT, ...(state?.steps.map((s) => s.key) ?? [])];
  const stepIndex = steps.indexOf(step);

  const renderStep = () => {
    if (step === ACCOUNT) return <StepAccount onDone={refresh} />;
    if (step === "verify") return <StepVerifyEmail onDone={refresh} />;
    if (step === "workspace") return <StepWorkspace onDone={refresh} onSkip={() => skip("workspace")} />;
    return renderOnboardingStep?.(step, { defaultPlan: planFromUrl, onDone: refresh, onSkip: () => skip(step) }) ?? null;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-page">
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-xl font-body-bold text-heading mb-8">{APP_FULL_NAME}</h1>

        {state && (
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
        )}

        <div className={`w-full ${step === "plan" ? "max-w-3xl" : "max-w-md"}`}>
          {renderStep()}
        </div>

        <div className="flex items-center justify-center gap-3 mt-8 text-[11px] text-muted">
          <a href="/terms" className="hover:text-heading transition-colors">{t("legal.terms")}</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-heading transition-colors">{t("legal.privacy")}</a>
          <CookiePreferencesLink separator />
          <span>·</span>
          <a href="/refund" className="hover:text-heading transition-colors">{t("legal.refund")}</a>
        </div>
      </div>
    </div>
  );
}
