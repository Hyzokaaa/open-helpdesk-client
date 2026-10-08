import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Toggle from "@modules/app/modules/ui/components/Toggle/Toggle";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { HttpResponseError } from "@modules/app/modules/http/domain/http";
import {
  getWorkspaceAnalyticsSettings,
  updateWorkspaceAnalyticsSettings,
  type WorkspaceAnalyticsSettings as Settings,
} from "../services/workspace-analytics.service";
import Checkbox from "@modules/app/modules/ui/components/Checkbox/Checkbox";

interface Props {
  slug: string;
}

interface Form {
  enabled: boolean;
  serverUrl: string;
  siteId: string;
  useCookies: boolean;
  trackEvents: boolean;
  shareWithInstallation: boolean;
}

function toForm(settings: Settings): Form {
  return {
    enabled: settings.provider === "matomo",
    serverUrl: settings.serverUrl ?? "",
    siteId: settings.siteId ?? "",
    useCookies: settings.useCookies,
    trackEvents: settings.trackEvents,
    shareWithInstallation: settings.shareWithInstallation,
  };
}

function sameForm(a: Form, b: Form): boolean {
  return a.enabled === b.enabled
    && a.serverUrl.trim() === b.serverUrl
    && a.siteId.trim() === b.siteId
    && a.useCookies === b.useCookies
    && a.trackEvents === b.trackEvents
    && a.shareWithInstallation === b.shareWithInstallation;
}

/** The backend's validation message, when it rejected the settings (400). */
function validationMessage(err: unknown): string | null {
  const e = err as Partial<HttpResponseError> | undefined;
  return e?.status === 400 && typeof e.message === "string" && e.message ? e.message : null;
}

/**
 * The workspace's own web analytics (its Matomo) and whether the installation's analytics also
 * measures this workspace. Shown to members with `workspace.analytics.manage`.
 */
export default function WorkspaceAnalyticsSettings({ slug }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaceAnalyticsSettings(slug)
      .then((settings) => {
        const value = toForm(settings);
        setSaved(value);
        setForm(value);
      })
      .catch(() => setError(t("workspaceAnalytics.loadError")))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return null;
  if (!form || !saved) return error ? <p className="text-xs text-red-500" role="alert">{error}</p> : null;

  const change = (patch: Partial<Form>) => {
    setForm({ ...form, ...patch });
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateWorkspaceAnalyticsSettings(
        slug,
        form.enabled
          ? {
              provider: "matomo",
              serverUrl: form.serverUrl.trim() || null,
              siteId: form.siteId.trim() || null,
              useCookies: form.useCookies,
              trackEvents: form.trackEvents,
              shareWithInstallation: form.shareWithInstallation,
            }
          : {
              provider: null,
              serverUrl: null,
              siteId: null,
              useCookies: false,
              trackEvents: true,
              shareWithInstallation: form.shareWithInstallation,
            },
      );
      const value = toForm(result);
      setSaved(value);
      setForm(value);
      toast.success(t("workspaceAnalytics.savedReload"));
    } catch (err) {
      const message = validationMessage(err) ?? t("workspaceAnalytics.saveError");
      setError(message);
      if (!(err as Partial<HttpResponseError>)?.handled) toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{t("workspaceAnalytics.description")}</p>

      <div>
        <p className="text-xs font-body-bold text-heading mb-2">{t("workspaceAnalytics.provider")}</p>
        <Toggle
          left={t("workspaceAnalytics.off")}
          right="Matomo"
          active={form.enabled ? "right" : "left"}
          onChange={(side) => change({ enabled: side === "right" })}
        />
      </div>

      {form.enabled && (
        <>
          <FormInput label={t("workspaceAnalytics.serverUrl")} className="!mb-0">
            <Input value={form.serverUrl} onChange={(serverUrl) => change({ serverUrl })} placeholder="https://analytics.example.com/" size="sm" />
            <p className="text-exs text-muted mt-1">{t("workspaceAnalytics.serverUrlHint")}</p>
          </FormInput>

          <FormInput label={t("workspaceAnalytics.siteId")} className="!mb-0">
            <Input value={form.siteId} onChange={(siteId) => change({ siteId })} placeholder="1" size="sm" />
            <p className="text-exs text-muted mt-1">{t("workspaceAnalytics.siteIdHint")}</p>
          </FormInput>

          <Checkbox
            checked={form.useCookies}
            onChange={(useCookies) => change({ useCookies })}
            label={t("workspaceAnalytics.useCookies")}
            hint={t("workspaceAnalytics.useCookiesHint")}
          />

          <Checkbox
            checked={form.trackEvents}
            onChange={(trackEvents) => change({ trackEvents })}
            label={t("workspaceAnalytics.trackEvents")}
            hint={t("workspaceAnalytics.trackEventsHint")}
          />
        </>
      )}

      <hr className="border-border-row" />

      <Checkbox
        checked={form.shareWithInstallation}
        onChange={(shareWithInstallation) => change({ shareWithInstallation })}
        label={t("workspaceAnalytics.share")}
        hint={t("workspaceAnalytics.shareHint")}
      />

      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

      <div className="flex justify-end">
        <Button size="xs" color="primary" loading={saving} onClick={handleSave} disabled={sameForm(form, saved)}>
          {t("workspaceAnalytics.save")}
        </Button>
      </div>

      <div className="bg-surface-hover rounded-lg p-3">
        <p className="text-exs text-muted">{t("workspaceAnalytics.note")}</p>
      </div>
    </div>
  );
}
