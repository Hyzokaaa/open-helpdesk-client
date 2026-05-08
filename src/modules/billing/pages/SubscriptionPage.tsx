import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getSubscription, cancelSubscription, renewSubscription, type Subscription } from "../services/billing.service";
import { GRACE_PERIOD_DAYS } from "../domain/billing.constants";

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
  const [showCancel, setShowCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    getSubscription()
      .then(setSubscription)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await cancelSubscription();
      const updated = await getSubscription();
      setSubscription(updated);
      toast.success(t("billing.cancelSuccess"));
    } catch {
      toast.error(t("billing.cancelError"));
    } finally {
      setCanceling(false);
      setShowCancel(false);
    }
  };

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const result = await renewSubscription();
      window.open(result.paymentUrl, "_blank");
    } catch {
      toast.error(t("billing.renewError"));
    } finally {
      setRenewing(false);
    }
  };

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

  const isFree = subscription.planId === "free";

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const daysUntilExpiry = periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = !isFree && daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 3;
  const isInGracePeriod = !isFree && daysUntilExpiry !== null && daysUntilExpiry <= 0 && daysUntilExpiry > -GRACE_PERIOD_DAYS;

  const formatDate = (date: string | null) =>
    date ? format(new Date(date), "MMM d, yyyy") : "-";

  return (
    <div className="w-full">
      <h2 className="text-lg font-body-bold text-heading mb-6">{t("billing.title")}</h2>

      {isExpiringSoon && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-4 max-w-lg flex items-center justify-between">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{t("billing.expiringSoon")} ({daysUntilExpiry} {t("billing.daysLeft")})</p>
          <Button size="xs" onClick={handleRenew} loading={renewing}>{t("billing.renew")}</Button>
        </div>
      )}

      {isInGracePeriod && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4 max-w-lg flex items-center justify-between">
          <p className="text-sm text-red-800 dark:text-red-200">{t("billing.gracePeriod")}</p>
          <Button size="xs" color="danger" onClick={handleRenew} loading={renewing}>{t("billing.renew")}</Button>
        </div>
      )}

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

        <div className="mt-6 pt-4 border-t border-border-card flex gap-3">
          <Button size="sm" onClick={() => navigate("/dashboard/settings/pricing")}>
            {t("billing.upgrade")}
          </Button>
          {!isFree && (
            <Button size="sm" color="danger" onClick={() => setShowCancel(true)}>
              {t("billing.cancelSubscription")}
            </Button>
          )}
        </div>
      </div>

      {showCancel && (
        <ConfirmModal
          title={t("billing.cancelConfirmTitle")}
          message={t("billing.cancelConfirmMessage")}
          confirmLabel={t("billing.cancelConfirmButton")}
          danger
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  );
}
