import { useState } from "react";
import { toast } from "react-toastify";
import { resendVerification } from "../services/auth.service";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import Button from "@modules/app/modules/ui/components/Button/Button";
import LanguageToggle from "@modules/app/components/LanguageToggle";

export default function EmailVerificationBanner() {
  const { t } = useTranslation();
  const { user, setUser, signOut } = useUser();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
      toast.success(t("verification.resent"));
    } catch {
      toast.error(t("verification.resendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-md px-4">
        <div className="bg-surface rounded-card border-card p-10 text-center">
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600 dark:text-emerald-400"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-lg font-body-bold text-heading mb-2">
            {t("verification.checkInbox")}
          </h2>

          <p className="text-sm text-muted mb-2">
            {t("verification.sentTo")}
          </p>

          <p className="text-sm font-body-medium text-body mb-6">
            {user?.email}
          </p>

          <p className="text-xs text-muted mb-6">
            {t("verification.spamHint")}
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleResend}
              disabled={sending || sent}
              full
              color="primary"
            >
              {sending
                ? t("verification.sending")
                : sent
                  ? t("verification.resent")
                  : t("verification.resend")}
            </Button>

            <Button onClick={signOut} full color="light">
              {t("nav.signOut")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
