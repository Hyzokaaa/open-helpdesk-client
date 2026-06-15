import { useState } from "react";
import clsx from "clsx";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { checkout } from "../services/billing.service";
import usePaddle from "../hooks/usePaddle";
import type { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { toast } from "react-toastify";

interface Props {
  planName: string;
  planId: string;
  price: string;
  billingCycle: string;
  onClose: () => void;
  onPaddleComplete: () => void;
  onTropiPayRedirect: (url: string) => void;
}

export default function CheckoutSheet({ planName, planId, price, billingCycle, onClose, onPaddleComplete, onTropiPayRedirect }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const { openCheckout } = usePaddle((event) => {
    if (event.name === "checkout.completed") {
      onClose();
      onPaddleComplete();
    }
    if (event.name === "checkout.closed") {
      setLoading(null);
    }
  });

  const handlePaddle = async () => {
    setLoading("paddle");
    try {
      const result = await checkout({ planId, billingCycle, gateway: "paddle" });
      if (result.transactionId) {
        openCheckout(result.transactionId);
      } else {
        toast.error(t("billing.checkoutError"));
        setLoading(null);
      }
    } catch (err) {
      const error = err as HttpResponseError;
      toast.error(error.message || t("billing.checkoutError"));
      setLoading(null);
    }
  };

  const handleTropiPay = async () => {
    setLoading("tropipay");
    try {
      const result = await checkout({ planId, billingCycle, gateway: "tropipay" });
      onTropiPayRedirect(result.paymentUrl);
    } catch (err) {
      const error = err as HttpResponseError;
      toast.error(error.message || t("billing.checkoutError"));
      setLoading(null);
    }
  };

  const cycleName = billingCycle === "yearly" ? t("billing.yearly") : t("billing.monthly");
  const isLoading = loading !== null;

  return (
    <Sheet onClose={onClose}>
      <div className="max-w-sm mx-auto">
        <h2 className="text-lg font-body-bold text-heading mb-1">{t("billing.checkout")}</h2>
        <p className="text-xs text-muted mb-5">{t("billing.checkoutDesc")}</p>

        <div className="rounded-lg border border-border-card p-4 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body-bold text-heading">{planName}</p>
              <p className="text-xs text-muted">{cycleName}</p>
            </div>
            <span className="text-xl font-body-bold text-heading">{price}</span>
          </div>
        </div>

        <Button
          full
          onClick={handlePaddle}
          loading={loading === "paddle"}
          disabled={isLoading}
        >
          {t("billing.payWithCard")}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted mt-2 mb-5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {t("billing.securePayment")}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border-card" />
          <span className="text-[11px] text-muted">{t("billing.orPayWith")}</span>
          <div className="flex-1 h-px bg-border-card" />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleTropiPay}
            disabled={isLoading}
            className={clsx(
              "w-full text-sm text-heading border border-border-card rounded-lg px-4 py-2.5 transition-all cursor-pointer hover:border-primary/50",
              isLoading && "opacity-50 pointer-events-none",
            )}
          >
            {loading === "tropipay" ? t("billing.processing") : "TropiPay"}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted py-1.5 opacity-50">
            <span>Crypto</span>
            <span className="text-[10px] bg-surface-hover px-1.5 py-0.5 rounded lowercase">{t("billing.comingSoon")}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-border-card text-[10px] text-muted">
          <a href="/terms" className="hover:text-heading transition-colors">{t("legal.terms")}</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-heading transition-colors">{t("legal.privacy")}</a>
          <span>·</span>
          <a href="/refund" className="hover:text-heading transition-colors">{t("legal.refund")}</a>
        </div>
      </div>
    </Sheet>
  );
}
