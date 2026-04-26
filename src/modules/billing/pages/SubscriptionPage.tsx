import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getSubscription, type Subscription } from "../services/billing.service";

const STATUS_COLOR: Record<string, "green" | "yellow" | "red" | "gray"> = {
  active: "green",
  pending: "yellow",
  canceled: "red",
  expired: "gray",
};

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscription()
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  if (!subscription) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-6">{t("billing.title")}</h2>
        <p className="text-sm text-muted">{t("billing.noSubscription")}</p>
        <Button size="sm" className="mt-4" onClick={() => navigate("/dashboard/settings/pricing")}>
          {t("billing.viewPlans")}
        </Button>
      </div>
    );
  }

  const formatDate = (date: string | null) =>
    date ? format(new Date(date), "MMM d, yyyy") : "-";

  return (
    <div className="w-full">
      <h2 className="text-lg font-body-bold text-heading mb-6">{t("billing.title")}</h2>

      <div className="bg-surface border border-border-card rounded-lg p-6 max-w-lg">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.plan")}</span>
            <span className="text-sm font-body-bold text-heading">{subscription.planName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.cycle")}</span>
            <span className="text-sm font-body-medium text-heading">
              {subscription.billingCycle === "yearly" ? t("billing.yearly") : t("billing.monthly")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.status")}</span>
            <StatusBadge
              label={subscription.status}
              color={STATUS_COLOR[subscription.status] ?? "gray"}
              size="xs"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.periodStart")}</span>
            <span className="text-sm text-heading">{formatDate(subscription.currentPeriodStart)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.periodEnd")}</span>
            <span className="text-sm text-heading">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border-card">
          <Button size="sm" onClick={() => navigate("/dashboard/settings/pricing")}>
            {t("billing.upgrade")}
          </Button>
        </div>
      </div>
    </div>
  );
}
