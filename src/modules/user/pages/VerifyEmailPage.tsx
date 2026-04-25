import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { verifyEmail } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import Button from "@modules/app/modules/ui/components/Button/Button";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard";
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
              <Button onClick={handleGoToDashboard} full color="primary">
                {t("verification.goToDashboard")}
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-body mb-4">{t("verification.error")}</p>
              <Button onClick={() => { window.location.href = "/login"; }} full color="light">
                {t("verification.goToLogin")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
