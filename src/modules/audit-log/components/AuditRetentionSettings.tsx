import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Switch from "@modules/app/modules/ui/components/Switch/Switch";
import useTranslation from "@modules/app/i18n/useTranslation";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { InstallationRetention, getInstallationRetention, updateInstallationRetention } from "../services/audit-log.service";
import RetentionRow, { retentionRowValid } from "./RetentionRow";
import useRetentionDraft from "../hooks/useRetentionDraft";

/**
 * The installation's audit retention (system admins). Off until turned on here: turning it on
 * deletes, the next night, every entry older than its category's days.
 */
export default function AuditRetentionSettings() {
  const { t, lang } = useTranslation();
  const [settings, setSettings] = useState<InstallationRetention | null>(null);
  const [enabled, setEnabled] = useState(false);
  const { draft, reset, isChanged, setValue, setForever, daysOf } = useRetentionDraft();
  const [saving, setSaving] = useState(false);

  const load = (s: InstallationRetention) => {
    setSettings(s);
    setEnabled(s.enabled);
    reset(s.days);
  };

  useEffect(() => {
    getInstallationRetention().then(load).catch(() => toast.error(t("auditRetention.loadError")));
  }, []);

  if (!settings) return null;

  const changed = enabled !== settings.enabled || settings.categories.some(isChanged);
  const valid = settings.categories.every((c) => retentionRowValid(draft[c], settings.minDays, settings.maxDays));
  const defaultOf = (c: string) => settings.defaults[c] ?? 365;
  // The server runs it at a fixed hour of its own time zone; shown in the viewer's, with the zone named
  const runTime = new Date(settings.nextRunAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" });

  const save = async () => {
    const days: Record<string, number | null> = {};
    for (const category of settings.categories) days[category] = daysOf(category);
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
      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="min-w-0">
          <span className="block text-sm text-body">{t("auditRetention.enabled")}</span>
          <span className="block text-xs text-muted mt-0.5">
            {enabled ? t("auditRetention.enabledOn").replace("{time}", runTime) : t("auditRetention.enabledOff")}
          </span>
        </span>
        <Switch checked={enabled} onChange={setEnabled} label={t("auditRetention.enabled")} />
      </label>

      <div className="flex items-baseline justify-between gap-4 mt-5">
        <p className="text-sm font-body-semibold text-heading">{t("auditRetention.perCategory")}</p>
        <p className="text-exs text-muted">
          {t("auditRetention.bounds").replace("{min}", String(settings.minDays)).replace("{max}", String(settings.maxDays))}
        </p>
      </div>

      <div className="divide-y divide-border-card mt-1">
        {settings.categories.map((category) => {
          const row = draft[category];
          return (
            <RetentionRow
              key={category}
              category={category}
              value={row?.value ?? ""}
              forever={row?.forever ?? false}
              min={settings.minDays}
              max={settings.maxDays}
              fallback={defaultOf(category)}
              hint={t("auditRetention.default").replace("{days}", String(defaultOf(category)))}
              onChange={(value) => setValue(category, value)}
              onForeverChange={(forever) => setForever(category, forever, defaultOf(category))}
            />
          );
        })}
      </div>

      {enabled && !settings.enabled && (
        <p className="rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 mt-3">
          {t("auditRetention.enableWarning").replace("{time}", runTime)}
        </p>
      )}
      <div className="flex justify-end mt-3">
        <Button size="sm" loading={saving} disabled={!changed || !valid} onClick={save}>{t("auditRetention.save")}</Button>
      </div>
    </div>
  );
}
