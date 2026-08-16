import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  getSystemBranding,
  updateSystemBranding,
  uploadSystemLogo,
  deleteSystemLogo,
} from "../services/system-branding.service";

export default function AdminBrandingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSystemBranding()
      .then((b) => {
        setName(b.appName ?? "");
        setSubtitle(b.appSubtitle ?? "");
        setLogo(b.logo);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSystemBranding({
        appName: name.trim() || null,
        appSubtitle: subtitle.trim() || null,
      });
      setName(result.appName ?? "");
      setSubtitle(result.appSubtitle ?? "");
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
      const result = await uploadSystemLogo(file);
      setLogo(result.logo);
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
      await deleteSystemLogo();
      setLogo(null);
      toast.success(t("branding.saved"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full max-w-3xl">
      <h2 className="text-lg font-body-bold text-heading mb-2">
        {t("adminBranding.title")}
      </h2>
      <p className="text-sm text-muted mb-6">{t("adminBranding.description")}</p>

      <div className="bg-surface rounded-card border-card p-6 space-y-4">
        <div>
          <label className="block text-xs font-body-bold text-heading mb-1">{t("branding.appName")}</label>
          <Input value={name} onChange={setName} placeholder="Open Helpdesk" />
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
          <p className="text-exs text-muted">{t("adminBranding.note")}</p>
        </div>
      </div>
    </div>
  );
}
