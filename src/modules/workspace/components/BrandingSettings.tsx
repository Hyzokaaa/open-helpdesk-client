import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import { setBranding, uploadLogo, deleteLogo } from "../services/workspace.service";
import { getSystemBranding, type SystemBranding } from "@modules/admin/services/system-branding.service";

interface Props {
  slug: string;
  appName: string | null;
  appSubtitle: string | null;
  logo: string | null;
  onUpdate: (appName: string | null, appSubtitle: string | null, logo: string | null) => void;
}

export default function BrandingSettings({ slug, appName, appSubtitle, logo, onUpdate }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(appName ?? "");
  const [subtitle, setSubtitle] = useState(appSubtitle ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [system, setSystem] = useState<SystemBranding | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSystemBranding().then(setSystem).catch(() => {});
  }, []);

  const systemName = system?.appName ?? "";
  const systemSubtitle = system?.appSubtitle ?? "";
  const systemLogo = system?.logo ?? null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await setBranding(slug, {
        appName: name.trim() || null,
        appSubtitle: subtitle.trim() || null,
      });
      onUpdate(result.appName, result.appSubtitle, logo);
      toast.success(t("branding.saved"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetField = async (field: "appName" | "appSubtitle") => {
    setSaving(true);
    try {
      const result = await setBranding(slug, { [field]: null });
      if (field === "appName") setName("");
      if (field === "appSubtitle") setSubtitle("");
      onUpdate(result.appName, result.appSubtitle, logo);
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error(t("branding.logoTooLarge"));
      return;
    }
    setUploading(true);
    try {
      const result = await uploadLogo(slug, file);
      onUpdate(appName, appSubtitle, result.logo);
      toast.success(t("branding.saved"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteLogo = async () => {
    setDeleting(true);
    try {
      await deleteLogo(slug);
      onUpdate(appName, appSubtitle, null);
      toast.success(t("branding.saved"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-body-bold text-heading">{t("branding.appName")}</label>
          {appName && <button type="button" className="text-exs text-primary hover:underline" onClick={() => handleResetField("appName")}>{t("branding.resetToSystem")}</button>}
        </div>
        <Input value={name} onChange={setName} placeholder={systemName || "Open Helpdesk"} />
        <p className="text-exs text-muted mt-1">
          {t("branding.appNameHint")}
          {!appName && systemName && ` ${t("branding.inheritedFromSystem")}`}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-body-bold text-heading">{t("branding.subtitle")}</label>
          {appSubtitle && <button type="button" className="text-exs text-primary hover:underline" onClick={() => handleResetField("appSubtitle")}>{t("branding.resetToSystem")}</button>}
        </div>
        <Input value={subtitle} onChange={setSubtitle} placeholder={systemSubtitle || ""} />
        <p className="text-exs text-muted mt-1">
          {t("branding.subtitleHint")}
          {!appSubtitle && systemSubtitle && ` ${t("branding.inheritedFromSystem")}`}
        </p>
      </div>

      <Button size="xs" loading={saving} onClick={handleSave}>{t("branding.save")}</Button>

      <div className="border-t border-border-card pt-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-body-bold text-heading">{t("branding.logo")}</p>
          {logo && <button type="button" className="text-exs text-primary hover:underline" onClick={handleDeleteLogo}>{t("branding.resetToSystem")}</button>}
        </div>

        {(logo || (!logo && systemLogo)) && (
          <div className="flex items-center gap-3 mb-3">
            <img src={logo ?? systemLogo!} alt="" className="w-12 h-12 object-contain rounded border border-border-card p-1" />
            {logo ? (
              <Button size="xs" color="danger" loading={deleting} onClick={handleDeleteLogo}>
                {t("branding.removeLogo")}
              </Button>
            ) : (
              <span className="text-exs text-muted">{t("branding.inheritedFromSystem")}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button size="xs" color="light" loading={uploading} onClick={() => fileRef.current?.click()}>
            {logo ? t("branding.changeLogo") : t("branding.uploadLogo")}
          </Button>
          <span className="text-exs text-muted">PNG, SVG, JPEG, WebP. Max 1MB</span>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
      </div>

      <div className="bg-surface-hover rounded-lg p-3 mt-4">
        <p className="text-exs text-muted">{t("branding.activationNote")}</p>
      </div>
    </div>
  );
}
