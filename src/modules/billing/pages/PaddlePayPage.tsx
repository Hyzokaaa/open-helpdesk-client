import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
    };
  }
}

export default function PaddlePayPage() {
  const { t } = useTranslation();
  const { paddleClientToken, paddleEnvironment, loading } = useConfig();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const transactionId = searchParams.get("_ptxn");

  useEffect(() => {
    if (loading) return;

    if (!transactionId) {
      navigate("/dashboard/settings/pricing", { replace: true });
      return;
    }

    if (!paddleClientToken) {
      setError("Paddle is not configured.");
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    if (paddleEnvironment === "sandbox") {
      script.src = "https://sandbox-cdn.paddle.com/paddle/v2/paddle.js";
    }
    script.async = true;
    script.onload = () => {
      if (!window.Paddle) return;

      if (paddleEnvironment !== "production") {
        window.Paddle.Environment.set(paddleEnvironment);
      }

      window.Paddle.Initialize({ token: paddleClientToken });
    };
    script.onerror = () => setError("Failed to load payment system.");
    document.head.appendChild(script);
  }, [loading, transactionId, paddleClientToken, paddleEnvironment, navigate]);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
      <Spinner width={24} />
      <p className="text-sm text-muted">{t("billing.loadingCheckout")}</p>
    </div>
  );
}
