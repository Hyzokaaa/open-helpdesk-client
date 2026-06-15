import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useConfig from "@modules/app/hooks/useConfig";
import useTranslation from "@modules/app/i18n/useTranslation";
import usePaddle from "../hooks/usePaddle";

export default function PaddlePayPage() {
  const { t } = useTranslation();
  const { paddleClientToken, loading } = useConfig();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const opened = useRef(false);

  const transactionId = searchParams.get("_ptxn");

  const { openCheckout } = usePaddle((event) => {
    if (event.name === "checkout.completed") {
      navigate("/dashboard/settings/billing/success", { replace: true });
    }
    if (event.name === "checkout.closed") {
      navigate("/dashboard/settings/pricing", { replace: true });
    }
  });

  useEffect(() => {
    if (loading) return;
    if (!transactionId) {
      navigate("/dashboard/settings/pricing", { replace: true });
      return;
    }
    if (!paddleClientToken) return;
    if (opened.current) return;

    // Wait for Paddle.js to be ready
    const interval = setInterval(() => {
      if (window.__paddleReady) {
        clearInterval(interval);
        opened.current = true;
        openCheckout(transactionId);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [loading, transactionId, paddleClientToken, navigate, openCheckout]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
      <Spinner width={24} />
      <p className="text-sm text-muted">{t("billing.loadingCheckout")}</p>
    </div>
  );
}
