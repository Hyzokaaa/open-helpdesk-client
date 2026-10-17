import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import { getProfile, resendVerification, verifyEmail } from "../services/auth.service";
import useUser from "../hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { announceEmailVerified } from "@modules/onboarding/domain/email-verified-signal";
import { pathAfterSignIn } from "@modules/onboarding/domain/after-sign-in";

type Status = "loading" | "success" | "error";

/**
 * The link of the verification email. Opening it again (a second click, a mail scanner) answers
 * the same. It never ends in a dead end: with a session in this browser "Continue" follows the
 * onboarding where it was left; without one, signing in does.
 */
export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: userLoading, setUser } = useUser();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [continuing, setContinuing] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    const verified = () => {
      setStatus("success");
      announceEmailVerified();
    };
    // An expired or reused link is no failure for an account already verified
    const alreadyVerified = async () => !!user && (await getProfile().catch(() => null))?.isEmailVerified === true;

    if (!token) {
      alreadyVerified().then((yes) => (yes ? verified() : setStatus("error")));
      return;
    }
    verifyEmail(token)
      .then(verified)
      .catch(async () => ((await alreadyVerified()) ? verified() : setStatus("error")));
  }, [token, userLoading]);

  const handleContinue = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setContinuing(true);
    try {
      setUser(await getProfile());
      navigate(await pathAfterSignIn(), { replace: true });
    } finally {
      setContinuing(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success(t("verification.resent"));
    } catch {
      toast.error(t("verification.resendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-sm px-4">
        <div className="bg-surface rounded-card border-card p-8 text-center">
          {status === "loading" && (
            <p className="text-sm text-muted">{t("verification.verifying")}</p>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-body mb-4">{t("verification.success")}</p>
              <Button onClick={handleContinue} loading={continuing} full>
                {user ? t("verification.continue") : t("verification.signInToContinue")}
              </Button>
              {user && <p className="text-xs text-muted mt-3">{t("verification.continueHint")}</p>}
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-body mb-4">{t("verification.error")}</p>
              <div className="flex flex-col gap-3">
                {user && (
                  <Button onClick={handleResend} loading={resending} full>
                    {t("verification.resend")}
                  </Button>
                )}
                <Button onClick={() => navigate(user ? "/onboarding" : "/login")} full color="light">
                  {user ? t("verification.continue") : t("verification.goToLogin")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
