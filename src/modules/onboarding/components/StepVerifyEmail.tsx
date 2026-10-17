import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { resendVerification, getProfile } from "@modules/user/services/auth.service";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import { onEmailVerified } from "../domain/email-verified-signal";

interface Props {
  onDone: () => void;
}

/** How often to look again, for a verification done on another device. */
const CHECK_EVERY_MS = 3000;

/**
 * "Verify your email": moves on by itself once the email is verified, at once when it happens in
 * another tab of this browser, within a few seconds when it happens elsewhere (the phone).
 */
export default function StepVerifyEmail({ onDone }: Props) {
  const { user, setUser, signOut } = useUser();
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  /** True when the email turned out to be verified, after moving on. */
  const check = useCallback(async (): Promise<boolean> => {
    const profile = await getProfile();
    setUser(profile);
    if (!profile.isEmailVerified) return false;
    onDone();
    return true;
  }, [onDone, setUser]);

  useEffect(() => {
    let done = false;
    const tick = () => {
      if (done) return;
      check().then((verified) => { done = verified; }).catch(() => { /* the next check tries again */ });
    };
    const interval = setInterval(tick, CHECK_EVERY_MS);
    const unsubscribe = onEmailVerified(tick);
    return () => { done = true; clearInterval(interval); unsubscribe(); };
  }, [check]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success(t("onboarding.verificationSent"));
    } catch {
      toast.error(t("onboarding.verificationSendError"));
    } finally {
      setResending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      if (!(await check())) toast.warning(t("onboarding.emailNotVerifiedYet"));
    } catch {
      toast.error(t("onboarding.checkError"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-surface rounded-card border-card p-8 text-center">
      <div className="text-4xl mb-4">✉</div>
      <h2 className="text-lg font-body-bold text-heading mb-2">{t("onboarding.verifyEmail")}</h2>
      <p className="text-sm text-muted mb-2">{t("onboarding.verifyEmailDesc")}</p>
      <p className="text-sm font-body-semibold text-heading mb-6">{user?.email}</p>

      <div className="flex flex-col gap-3">
        <Button full onClick={handleCheck} loading={checking}>
          {t("onboarding.alreadyVerified")}
        </Button>
        <Button full color="light" onClick={handleResend} loading={resending}>
          {t("onboarding.resendEmail")}
        </Button>
        <button type="button" onClick={signOut} className="text-xs text-muted hover:text-body cursor-pointer mt-1">
          {t("nav.signOut")}
        </button>
      </div>
    </div>
  );
}
