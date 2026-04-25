import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { verifyEmail } from "../services/auth.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import { APP_NAME } from "@modules/app/domain/constants/env";

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

  return (
    <div className="min-h-dvh flex items-center justify-center bg-page">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-card border-card p-8 text-center">
          <h1 className="text-xl font-body-bold text-heading mb-4">
            {APP_NAME}
          </h1>

          {status === "loading" && (
            <p className="text-sm text-muted">{t("verification.verifying")}</p>
          )}

          {status === "success" && (
            <>
              <p className="text-sm text-body mb-4">{t("verification.success")}</p>
              <Link to="/dashboard" className="text-sm text-primary hover:underline">
                {t("verification.goToDashboard")}
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <p className="text-sm text-body mb-4">{t("verification.error")}</p>
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t("verification.goToLogin")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
