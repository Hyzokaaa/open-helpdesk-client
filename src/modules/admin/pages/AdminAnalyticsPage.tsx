import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { getSystemAnalytics, updateSystemAnalytics, type SystemAnalytics } from "../services/system-analytics.service";

interface Form {
  enabled: boolean;
  serverUrl: string;
  siteId: string;
  useCookies: boolean;
  trackEvents: boolean;
}

function toForm(settings: SystemAnalytics): Form {
  return {
    enabled: settings.provider === "matomo",
    serverUrl: settings.serverUrl ?? "",
    siteId: settings.siteId ?? "",
    useCookies: settings.useCookies,
    trackEvents: settings.trackEvents,
  };
}

function sameForm(a: Form, b: Form): boolean {
  return a.enabled === b.enabled
    && a.serverUrl.trim() === b.serverUrl
    && a.siteId.trim() === b.siteId
    && a.useCookies === b.useCookies
    && a.trackEvents === b.trackEvents;
}

/**
 * The backend's validation message, if it rejected the settings. The http client rejects with
 * `{ message, status }`, class-validator's list already joined into one string.
 */
function errorMessage(err: unknown): string | null {
  const e = err as Partial<HttpResponseError> | undefined;
  return e?.status === 400 && typeof e.message === "string" && e.message ? e.message : null;
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSystemAnalytics()
      .then((settings) => {
        const value = toForm(settings);
        setSaved(value);
        setForm(value);
      })
      .catch(() => toast.error(t("adminAnalytics.loadError")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;
  if (!form || !saved) return null;

  const change = (patch: Partial<Form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };

  const hasChanges = !sameForm(form, saved);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateSystemAnalytics(
        form.enabled
          ? {
              provider: "matomo",
              serverUrl: form.serverUrl.trim() || null,
              siteId: form.siteId.trim() || null,
              useCookies: form.useCookies,
              trackEvents: form.trackEvents,
            }
          : { provider: null, serverUrl: null, siteId: null, useCookies: false, trackEvents: true },
      );
      const value = toForm(result);
      setSaved(value);
      setForm(value);
      toast.success(t("adminAnalytics.savedReload"));
    } catch (err) {
      const message = errorMessage(err);
      setError(message ?? t("adminAnalytics.saveError"));
      toast.error(message ?? t("adminAnalytics.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-2">{t("adminAnalytics.title")}</h2>
      <p className="text-sm text-muted mb-6">{t("adminAnalytics.description")}</p>

      <div className="bg-surface rounded-card border-card p-6 space-y-4">
        <div>
          <p className="text-xs font-body-bold text-heading mb-2">{t("adminAnalytics.provider")}</p>
          <Toggle
            left={t("adminAnalytics.off")}
            right="Matomo"
            active={form.enabled ? "right" : "left"}
            onChange={(side) => change({ enabled: side === "right" })}
          />
        </div>

        {form.enabled && (
          <>
            <FormInput label={t("adminAnalytics.serverUrl")} className="!mb-0">
              <Input value={form.serverUrl} onChange={(serverUrl) => change({ serverUrl })} placeholder="https://analytics.example.com/" />
              <p className="text-exs text-muted mt-1">{t("adminAnalytics.serverUrlHint")}</p>
            </FormInput>

            <FormInput label={t("adminAnalytics.siteId")} className="!mb-0">
              <Input value={form.siteId} onChange={(siteId) => change({ siteId })} placeholder="1" />
              <p className="text-exs text-muted mt-1">{t("adminAnalytics.siteIdHint")}</p>
            </FormInput>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useCookies}
                onChange={(e) => change({ useCookies: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-primary"
              />
              <span>
                <span className="block text-sm text-secondary-text font-body-medium">{t("adminAnalytics.useCookies")}</span>
                <span className="block text-exs text-muted">{t("adminAnalytics.useCookiesHint")}</span>
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.trackEvents}
                onChange={(e) => change({ trackEvents: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-primary"
              />
              <span>
                <span className="block text-sm text-secondary-text font-body-medium">{t("adminAnalytics.trackEvents")}</span>
                <span className="block text-exs text-muted">{t("adminAnalytics.trackEventsHint")}</span>
              </span>
            </label>
          </>
        )}

        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

        <div className="flex justify-end">
          <Button size="xs" loading={saving} onClick={handleSave} disabled={!hasChanges}>{t("adminAnalytics.save")}</Button>
        </div>

        <div className="bg-surface-hover rounded-lg p-3">
          <p className="text-exs text-muted">{t("adminAnalytics.note")}</p>
        </div>
      </div>
    </div>
  );
}
