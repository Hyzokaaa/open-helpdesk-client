import { useEffect, useState } from "react";
import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { getSubscription, type Subscription } from "../services/billing.service";
import { GRACE_PERIOD_DAYS } from "../domain/billing.constants";

export default function SubscriptionBanner() {
  const { t } = useTranslation();
  const { saasMode } = useConfig();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (saasMode) getSubscription().then(setSubscription).catch(() => {});
  }, [saasMode]);

  if (!saasMode || !subscription || subscription.planId === "free") return null;
  if (!subscription.currentPeriodEnd) return null;

  const now = new Date();
  const periodEnd = new Date(subscription.currentPeriodEnd);
  const daysLeft = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isExpiringSoon = daysLeft > 0 && daysLeft <= 3;
  const isInGracePeriod = daysLeft <= 0 && daysLeft > -GRACE_PERIOD_DAYS;

  if (!isExpiringSoon && !isInGracePeriod) return null;

  return (
    <div className={`w-full px-4 py-2 text-center text-xs font-body-medium flex items-center justify-center gap-2 ${
      isInGracePeriod
        ? "bg-red-500 text-white"
        : "bg-yellow-400 text-yellow-900"
    }`}>
      <span>
        {isInGracePeriod ? t("billing.gracePeriod") : `${t("billing.expiringSoon")} (${daysLeft} ${t("billing.daysLeft")})`}
      </span>
      <Link
        to="/dashboard/settings/billing"
        className={`underline font-body-bold ${isInGracePeriod ? "text-white" : "text-yellow-900"}`}
      >
        {t("billing.renew")}
      </Link>
    </div>
  );
}
