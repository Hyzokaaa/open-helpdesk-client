import { useNavigate } from "react-router";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  success: boolean;
}

export default function PaymentResultPage({ success }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center py-16">
      <div className="bg-surface border border-border-card rounded-lg p-8 max-w-md w-full text-center">
        <div className={`text-4xl mb-4 ${success ? "text-green-500" : "text-red-500"}`}>
          {success ? "\u2713" : "\u2717"}
        </div>
        <h2 className="text-lg font-body-bold text-heading mb-2">
          {success ? t("billing.paymentSuccess") : t("billing.paymentFailed")}
        </h2>
        <p className="text-sm text-muted mb-6">
          {success ? t("billing.paymentSuccessDescription") : t("billing.paymentFailedDescription")}
        </p>
        <div className="flex justify-center">
          <Button
            size="sm"
            color="primary"
            onClick={() => navigate("/dashboard/settings/billing")}
          >
            {t("billing.viewSubscription")}
          </Button>
        </div>
      </div>
    </div>
  );
}
