import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Button from "@modules/app/modules/ui/components/Button/Button";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Tooltip from "@modules/app/modules/ui/components/Tooltip/Tooltip";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getSubscription, getPlans, cancelSubscription, renewSubscription, updateExtraSeats, reactivateSubscription, previewSeats, type Subscription, type Plan, type SeatsPreview } from "../services/billing.service";
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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [seatQuantity, setSeatQuantity] = useState(0);
  const [savingSeats, setSavingSeats] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [seatsPreview, setSeatsPreview] = useState<SeatsPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    Promise.all([getSubscription(), getPlans()])
      .then(([sub, p]) => { setSubscription(sub); setPlans(p); })
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

  const currentPlan = plans.find((p) => p.id === subscription.planId);
  const baseAgents = currentPlan?.limits.maxAgentsPerWorkspace ?? 0;
  const extraSeats = subscription.extraSeats ?? 0;
  const totalAgents = baseAgents === -1 ? -1 : baseAgents + extraSeats;
  const isFree = subscription.planId === "free";
  const isCanceled = subscription.status === "canceled";
  const isGranted = subscription.source === "granted" && !isFree;
  const seatPrice = subscription.billingCycle === "yearly" ? 90 : 9;

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await reactivateSubscription();
      const updated = await getSubscription();
      setSubscription(updated);
      toast.success(t("billing.reactivateSuccess"));
    } catch {
      toast.error(t("billing.reactivateError"));
    } finally {
      setReactivating(false);
    }
  };

  const handlePreviewSeats = async (qty: number) => {
    if (qty === extraSeats) { setSeatsPreview(null); return; }
    setLoadingPreview(true);
    try {
      const preview = await previewSeats(qty);
      setSeatsPreview(preview);
    } catch {
      setSeatsPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleUpdateSeats = async () => {
    setSavingSeats(true);
    try {
      await updateExtraSeats(seatQuantity);
      const updated = await getSubscription();
      setSubscription(updated);
      setShowSeatsModal(false);
      toast.success(t("billing.seatsUpdated"));
    } catch {
      toast.error(t("billing.seatsError"));
    } finally {
      setSavingSeats(false);
    }
  };

  const now = new Date();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const daysUntilExpiry = periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isPaddle = subscription.gateway === "paddle";
  const isExpiringSoon = !isFree && !isPaddle && daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 3;
  const isInGracePeriod = !isFree && !isPaddle && daysUntilExpiry !== null && daysUntilExpiry <= 0 && daysUntilExpiry > -GRACE_PERIOD_DAYS;

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
            <span className="text-sm font-body-bold text-heading flex items-center gap-2">
              {subscription.planName}
              {isGranted && (
                <span className="text-exs font-body-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40 px-1.5 py-0.5 rounded">
                  {t("billing.granted")}
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.cycle")}</span>
            <span className="text-sm font-body-medium text-heading">
              {subscription.billingCycle === "yearly" ? t("billing.yearly") : t("billing.monthly")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.status")}</span>
            <span className="flex items-center gap-1.5">
              <StatusBadge
                label={subscription.status}
                color={STATUS_COLOR[subscription.status] ?? "gray"}
                size="xs"
              />
              {isCanceled && <Tooltip text={t("billing.tooltipCanceled")} />}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.periodStart")}</span>
            <span className="text-sm text-heading">{formatDate(subscription.currentPeriodStart)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted">{t("billing.periodEnd")}</span>
            <span className="text-sm text-heading">{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
          {totalAgents !== -1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">{t("billing.agentSeats")}</span>
              <span className="text-sm text-heading">
                {baseAgents} {t("billing.included")}
                {extraSeats > 0 && <span className="text-primary"> + {extraSeats} {t("billing.extra")}</span>}
              </span>
            </div>
          )}
        </div>

        {isCanceled && periodEnd && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t("billing.canceledNotice")} {formatDate(subscription.currentPeriodEnd)}.
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border-card flex gap-3">
          {isCanceled ? (
            <span className="flex items-center gap-1.5">
              <Button size="sm" color="primary" loading={reactivating} onClick={handleReactivate}>
                {t("billing.reactivate")}
              </Button>
              <Tooltip text={t("billing.tooltipReactivate")} />
            </span>
          ) : (
            <Button size="sm" onClick={() => navigate("/dashboard/settings/pricing")}>
              {t("billing.upgrade")}
            </Button>
          )}
          {!isFree && !isCanceled && totalAgents !== -1 && isPaddle && (
            <span className="flex items-center gap-1.5">
              <Button size="sm" color="light" onClick={() => { setSeatQuantity(extraSeats); setSeatsPreview(null); setShowSeatsModal(true); }}>
                {t("billing.manageSeats")}
              </Button>
              <Tooltip text={t("billing.tooltipManageSeats")} />
            </span>
          )}
          {!isFree && !isCanceled && (
            <span className="flex items-center gap-1.5">
              <Button size="sm" color="danger" onClick={() => setShowCancel(true)}>
                {t("billing.cancelSubscription")}
              </Button>
              <Tooltip text={t("billing.tooltipCancel")} />
            </span>
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

      {showSeatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSeatsModal(false)}>
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-body-bold text-heading mb-1">{t("billing.manageSeats")}</h3>
            <p className="text-sm text-muted mb-4">
              {baseAgents} {t("billing.included")} · ${seatPrice}/{subscription.billingCycle === "yearly" ? t("billing.perYear") : t("billing.perMonth")} {t("billing.perSeat")}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-body">{t("billing.extraSeats")}</label>
              <input
                type="number"
                min={0}
                value={seatQuantity}
                onChange={(e) => { const v = Math.max(0, parseInt(e.target.value) || 0); setSeatQuantity(v); handlePreviewSeats(v); }}
                className="w-20 bg-surface rounded-input border-input px-3 py-1.5 text-sm text-body shadow-input border-input-effect outline-none"
              />
            </div>
            {seatQuantity > 0 && (
              <p className="text-sm text-body mb-4">
                {seatQuantity} × ${seatPrice} = <span className="font-body-bold">${seatQuantity * seatPrice}{subscription.billingCycle === "yearly" ? t("billing.yr") : t("billing.mo")}</span>
              </p>
            )}
            <p className="text-xs text-subtle mb-2">
              {t("billing.totalAgents")}: {baseAgents + seatQuantity}
            </p>
            {seatQuantity < extraSeats && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded px-2.5 py-2 mb-4">
                {t("billing.seatsReduceWarning")}
              </p>
            )}
            {seatQuantity > extraSeats && !seatsPreview && (
              <p className="text-xs text-subtle mb-4">
                {t("billing.seatsIncreaseNote")}
              </p>
            )}
            {loadingPreview && (
              <div className="flex items-center gap-2 mb-4">
                <Spinner width={14} />
                <span className="text-xs text-subtle">{t("billing.calculatingCharges")}</span>
              </div>
            )}
            {seatsPreview?.immediate && !loadingPreview && seatQuantity !== extraSeats && (() => {
              const p = seatsPreview.immediate!;
              const cur = p.currencyCode;
              const fmt = (v: number) => `${cur} ${(Math.abs(v) / 100).toFixed(2)}`;
              const total = parseInt(p.total);
              const credit = parseInt(p.credit);
              const grandTotal = parseInt(p.grandTotal);
              const remainingCredit = parseInt(p.remainingCredit);
              return (
                <div className="bg-surface-hover rounded px-3 py-2.5 mb-4 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-subtle">{t("billing.monthlyRate")}</span>
                    <span className="text-body">${seatQuantity * seatPrice}.00{t("billing.mo")}</span>
                  </div>
                  {total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-subtle">{t("billing.proratedCharge")}</span>
                      <span className="text-body">{fmt(total)}</span>
                    </div>
                  )}
                  {credit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-subtle">{t("billing.creditApplied")}</span>
                      <span className="text-green-600 dark:text-green-400">-{fmt(credit)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border-card pt-1">
                    <span className="text-body font-body-semibold">{t("billing.totalDue")}</span>
                    <span className="text-body font-body-bold">{fmt(grandTotal)}</span>
                  </div>
                  {remainingCredit > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400 font-body-medium">{t("billing.remainingCredit")}</span>
                      <span className="text-green-600 dark:text-green-400 font-body-bold">{fmt(remainingCredit)}</span>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex justify-end gap-2">
              <Button size="sm" color="light" onClick={() => setShowSeatsModal(false)}>{t("ticketDetail.cancel")}</Button>
              <Button size="sm" color="primary" loading={savingSeats} disabled={seatQuantity === extraSeats} onClick={handleUpdateSeats}>
                {t("ticketDetail.confirmSave")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
