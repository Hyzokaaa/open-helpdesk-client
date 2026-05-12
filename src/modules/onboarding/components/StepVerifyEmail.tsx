import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { resendVerification, getProfile } from "@modules/user/services/auth.service";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  onDone: () => void;
}

export default function StepVerifyEmail({ onDone }: Props) {
  const { user, setUser } = useUser();
  const { t } = useTranslation();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const profile = await getProfile();
        if (profile.isEmailVerified) {
          if (pollRef.current) clearInterval(pollRef.current);
          setUser(profile);
          onDone();
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [onDone, setUser]);

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
      const profile = await getProfile();
      setUser(profile);
      if (profile.isEmailVerified) {
        onDone();
      } else {
        toast.warning(t("onboarding.emailNotVerifiedYet"));
      }
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
      </div>
    </div>
  );
}
