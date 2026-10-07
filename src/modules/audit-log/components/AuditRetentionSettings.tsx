import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { InstallationRetention, getInstallationRetention, updateInstallationRetention } from "../services/audit-log.service";
import RetentionRow from "./RetentionRow";

type Draft = Record<string, { value: string; forever: boolean }>;

function toDraft(days: Record<string, number | null>): Draft {
  return Object.fromEntries(Object.entries(days).map(([c, d]) => [c, { value: d === null ? "" : String(d), forever: d === null }]));
}

/**
 * The installation's audit retention (system admins). Off until turned on here: turning it on
 * deletes, the next night, every entry older than its category's days.
 */
export default function AuditRetentionSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<InstallationRetention | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);

  const load = (s: InstallationRetention) => {
    setSettings(s);
    setEnabled(s.enabled);
    setDraft(toDraft(s.days));
  };

  useEffect(() => {
    getInstallationRetention().then(load).catch(() => toast.error(t("auditRetention.loadError")));
  }, []);

  if (!settings) return null;

  const save = async () => {
    const days: Record<string, number | null> = {};
    for (const category of settings.categories) {
      const row = draft[category];
      days[category] = row?.forever ? null : Number(row?.value);
    }
    setSaving(true);
    try {
      load(await updateInstallationRetention({ enabled, days }));
      toast.success(t("auditRetention.saved"));
    } catch (err) {
      const e = err as HttpResponseError;
      if (!e?.handled) toast.error(e?.message || t("auditRetention.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t("auditRetention.intro")}</p>
      <label className="flex items-start gap-2 cursor-pointer mb-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 mt-0.5 accent-primary" />
        <span className="text-sm text-body">{t("auditRetention.enabled")}</span>
      </label>
      {enabled && !settings.enabled && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">{t("auditRetention.enableWarning")}</p>
      )}
      {!enabled && <p className="text-xs text-muted mb-2">{t("auditRetention.disabledNote")}</p>}

      <div className="divide-y divide-border-row">
        {settings.categories.map((category) => (
          <RetentionRow
            key={category}
            category={category}
            value={draft[category]?.value ?? ""}
            forever={draft[category]?.forever ?? false}
            onChange={(value) => setDraft({ ...draft, [category]: { value, forever: false } })}
            onForeverChange={(forever) => setDraft({ ...draft, [category]: { value: draft[category]?.value || String(settings.defaults[category] ?? 365), forever } })}
          />
        ))}
      </div>
      <p className="text-exs text-muted mt-2">
        {t("auditRetention.bounds").replace("{min}", String(settings.minDays)).replace("{max}", String(settings.maxDays))}
      </p>
      <div className="flex justify-end mt-3">
        <Button size="sm" loading={saving} onClick={save}>{t("auditRetention.save")}</Button>
      </div>
    </div>
  );
}
