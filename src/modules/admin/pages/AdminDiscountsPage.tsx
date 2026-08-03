import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import useUser from "@modules/user/hooks/useUser";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import {
  PaddleDiscount,
  listDiscounts,
  createDiscount,
  updateDiscount,
} from "../services/discount.service";

const TYPES = ["percentage", "flat"] as const;

export default function AdminDiscountsPage() {
  const { user } = useUser();
  const { t } = useTranslation();
  const formatDate = useFormatDate();

  const [discounts, setDiscounts] = useState<PaddleDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<PaddleDiscount | null>(null);

  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "flat">("percentage");
  const [amount, setAmount] = useState("");
  const [recur, setRecur] = useState(true);
  const [maxIntervals, setMaxIntervals] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listDiscounts();
      setDiscounts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!user?.isSystemAdmin) return <Navigate to="/dashboard" replace />;

  const resetForm = () => {
    setDescription("");
    setCode("");
    setType("percentage");
    setAmount("");
    setRecur(true);
    setMaxIntervals("");
    setUsageLimit("");
    setExpiresAt("");
    setSubmitted(false);
  };

  const getFieldError = (field: string): string | null => {
    switch (field) {
      case "description":
        if (!description.trim()) return t("discounts.val.descriptionRequired");
        return null;
      case "code":
        if (code && !/^[A-Z0-9]{1,32}$/.test(code)) return t("discounts.val.codeFormat");
        return null;
      case "amount": {
        const num = parseFloat(amount);
        if (!amount || isNaN(num)) return t("discounts.val.amountRequired");
        if (type === "percentage" && (num < 0.01 || num > 100)) return t("discounts.val.percentageRange");
        if (type === "flat" && (num < 1 || !Number.isInteger(num))) return t("discounts.val.flatRange");
        return null;
      }
      case "maxIntervals":
        if (maxIntervals) {
          const mi = parseInt(maxIntervals);
          if (isNaN(mi) || mi < 1) return t("discounts.val.maxIntervalsMin");
        }
        return null;
      case "usageLimit":
        if (usageLimit) {
          const ul = parseInt(usageLimit);
          if (isNaN(ul) || ul < 1) return t("discounts.val.usageLimitMin");
        }
        return null;
      case "expiresAt":
        if (expiresAt && new Date(expiresAt) <= new Date()) return t("discounts.val.expiresFuture");
        return null;
      default:
        return null;
    }
  };

  const allFields = ["description", "code", "amount", "maxIntervals", "usageLimit", "expiresAt"];
  const hasErrors = allFields.some((f) => getFieldError(f) !== null);

  const showError = (field: string): string | null => {
    const err = getFieldError(field);
    if (!err) return null;
    if (field === "description" || field === "amount") return submitted ? err : null;
    return err;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;

    setCreating(true);
    try {
      await createDiscount({
        description: description.trim(),
        type,
        amount,
        code: code || undefined,
        recur,
        maximum_recurring_intervals: maxIntervals ? parseInt(maxIntervals) : undefined,
        usage_limit: usageLimit ? parseInt(usageLimit) : undefined,
        enabled_for_checkout: true,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      resetForm();
      setShowCreate(false);
      fetchData();
      toast.success(t("discounts.created"));
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || t("discounts.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEnabled = async (d: PaddleDiscount) => {
    try {
      await updateDiscount(d.id, { enabled_for_checkout: !d.enabled_for_checkout });
      setConfirmToggle(null);
      fetchData();
      toast.success(t("discounts.updated"));
    } catch {
      toast.error(t("discounts.updateError"));
    }
  };

  const formatAmount = (d: PaddleDiscount) => {
    if (d.type === "percentage") return `${d.amount}%`;
    return `$${(parseInt(d.amount) / 100).toFixed(2)}`;
  };

  const formatUsage = (d: PaddleDiscount) => {
    if (d.usage_limit) return `${d.times_used} / ${d.usage_limit}`;
    return `${d.times_used} / ∞`;
  };

  const numericInputClass = (field: string) =>
    inputClass({ size: "sm", full: true, extra: showError(field) ? "!border-danger" : undefined });

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full">
      {confirmToggle && (
        <ConfirmModal
          title={confirmToggle.enabled_for_checkout ? t("discounts.disable") : t("discounts.enable")}
          message={t("discounts.confirmToggle").replace("{code}", confirmToggle.code || confirmToggle.description)}
          confirmLabel={confirmToggle.enabled_for_checkout ? t("discounts.disable") : t("discounts.enable")}
          danger={confirmToggle.enabled_for_checkout}
          onConfirm={() => handleToggleEnabled(confirmToggle)}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {showCreate && (
        <Sheet onClose={() => { setShowCreate(false); resetForm(); }} size="md">
          <h3 className="text-lg font-body-bold text-heading mb-3">{t("discounts.new")}</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <FormInput label={t("discounts.description")} required>
              <Input value={description} onChange={setDescription} placeholder={t("discounts.descriptionPlaceholder")} />
              {showError("description") && <p className="text-exs text-danger mt-1">{showError("description")}</p>}
            </FormInput>

            <FormInput label={t("discounts.code")}>
              <Input value={code} onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="FOUNDING40" />
              {showError("code") ? <p className="text-exs text-danger mt-1">{showError("code")}</p> : <p className="text-exs text-muted mt-1">{t("discounts.codeHint")}</p>}
            </FormInput>

            <FormInput label={t("discounts.type")} required>
              <Select
                options={[...TYPES]}
                label={(v) => v === "percentage" ? t("discounts.percentage") : t("discounts.flat")}
                value={(v) => v === type}
                onChange={(v) => { setType(v); setAmount(""); }}
              />
            </FormInput>

            <FormInput label={t("discounts.amount")} required>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  if (raw === "" || raw === ".") { setAmount(raw === "." && type === "flat" ? "" : raw); return; }
                  if (type === "flat" && raw.includes(".")) return;
                  if (raw.split(".").length > 2) return;
                  const num = parseFloat(raw);
                  if (isNaN(num)) return;
                  if (type === "percentage" && num > 100) return;
                  setAmount(raw);
                }}
                placeholder={type === "percentage" ? "40" : "1500"}
                className={numericInputClass("amount")}
              />
              {showError("amount") ? <p className="text-exs text-danger mt-1">{showError("amount")}</p> : <p className="text-exs text-muted mt-1">{type === "percentage" ? "0.01 – 100" : t("discounts.flatHint")}</p>}
            </FormInput>

            <FormInput label={t("discounts.recur")}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recur}
                  onChange={(e) => setRecur(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-body">{t("discounts.recurHint")}</span>
              </label>
            </FormInput>

            {recur && (
              <FormInput label={t("discounts.maxIntervals")}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxIntervals}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setMaxIntervals(v);
                  }}
                  placeholder="12"
                  className={numericInputClass("maxIntervals")}
                />
                {showError("maxIntervals") ? <p className="text-exs text-danger mt-1">{showError("maxIntervals")}</p> : <p className="text-exs text-muted mt-1">{t("discounts.maxIntervalsHint")}</p>}
              </FormInput>
            )}

            <FormInput label={t("discounts.usageLimit")}>
              <input
                type="text"
                inputMode="numeric"
                value={usageLimit}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setUsageLimit(v);
                }}
                placeholder="5"
                className={numericInputClass("usageLimit")}
              />
              {showError("usageLimit") && <p className="text-exs text-danger mt-1">{showError("usageLimit")}</p>}
            </FormInput>

            <FormInput label={t("discounts.expires")}>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={numericInputClass("expiresAt")}
              />
              {showError("expiresAt") && <p className="text-exs text-danger mt-1">{showError("expiresAt")}</p>}
            </FormInput>

            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" color="light" onClick={() => { setShowCreate(false); resetForm(); }}>
                {t("members.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={creating} disabled={submitted && hasErrors}>
                {t("discounts.create")}
              </Button>
            </div>
          </form>
        </Sheet>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">{t("discounts.title")}</h2>
        <Button onClick={() => setShowCreate(true)} size="sm">{t("discounts.new")}</Button>
      </div>

      {discounts.length === 0 ? (
        <Card className="p-8 text-center text-muted">{t("discounts.empty")}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-row text-left text-muted">
                <th className="px-4 py-3 font-body-medium">{t("discounts.code")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.description")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.amount")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.recur")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.usage")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.status")}</th>
                <th className="px-4 py-3 font-body-medium">{t("discounts.expires")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-border-row last:border-0 hover:bg-hover">
                  <td className="px-4 py-3 font-mono text-sm">{d.code || "—"}</td>
                  <td className="px-4 py-3 text-heading">{d.description}</td>
                  <td className="px-4 py-3">{formatAmount(d)}</td>
                  <td className="px-4 py-3">
                    {d.recur
                      ? d.maximum_recurring_intervals ? `${d.maximum_recurring_intervals} ${t("discounts.cycles")}` : "∞"
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{formatUsage(d)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      color={d.enabled_for_checkout && d.status === "active" ? "green" : "gray"}
                      label={d.enabled_for_checkout && d.status === "active" ? t("discounts.enabled") : t("discounts.disabled")}
                      size="xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">{d.expires_at ? formatDate(d.expires_at) : "—"}</td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      items={[
                        {
                          label: d.enabled_for_checkout ? t("discounts.disable") : t("discounts.enable"),
                          onClick: () => setConfirmToggle(d),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
