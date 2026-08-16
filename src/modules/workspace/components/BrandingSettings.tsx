import { useRef, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { setBranding, uploadLogo, deleteLogo } from "../services/workspace.service";

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
  const fileRef = useRef<HTMLInputElement>(null);

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
        <label className="block text-xs font-body-bold text-heading mb-1">{t("branding.appName")}</label>
        <Input value={name} onChange={setName} placeholder="My Company Helpdesk" />
        <p className="text-exs text-muted mt-1">{t("branding.appNameHint")}</p>
      </div>

      <div>
        <label className="block text-xs font-body-bold text-heading mb-1">{t("branding.subtitle")}</label>
        <Input value={subtitle} onChange={setSubtitle} placeholder="" />
        <p className="text-exs text-muted mt-1">{t("branding.subtitleHint")}</p>
      </div>

      <Button size="xs" loading={saving} onClick={handleSave}>{t("branding.save")}</Button>

      <div className="border-t border-border-card pt-4 mt-4">
        <p className="text-xs font-body-bold text-heading mb-2">{t("branding.logo")}</p>

        {logo && (
          <div className="flex items-center gap-3 mb-3">
            <img src={logo} alt="" className="w-12 h-12 object-contain rounded border border-border-card p-1" />
            <Button size="xs" color="danger" loading={deleting} onClick={handleDeleteLogo}>
              {t("branding.removeLogo")}
            </Button>
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
        <p className="text-exs text-muted">
          {t("branding.activationNote")}
        </p>
      </div>
    </div>
  );
}
