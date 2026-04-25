import { useState } from "react";
import { toast } from "react-toastify";
import { resendVerification } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function EmailVerificationBanner() {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success(t("verification.resent"));
    } catch {
      toast.error(t("verification.resendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
      <span className="text-sm text-amber-800 dark:text-amber-200">
        {t("verification.banner")}{" "}
        <button
          onClick={handleResend}
          disabled={sending}
          className="underline font-medium hover:no-underline disabled:opacity-50"
        >
          {sending ? t("verification.sending") : t("verification.resend")}
        </button>
      </span>
    </div>
  );
}
