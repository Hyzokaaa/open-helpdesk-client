import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  getSystemBranding,
  updateSystemBranding,
  uploadSystemLogo,
  deleteSystemLogo,
  uploadSystemIcon,
  deleteSystemIcon,
} from "../services/system-branding.service";
import BrandLogo from "@modules/app/components/BrandLogo";

export default function AdminBrandingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [savedName, setSavedName] = useState("");
  const [savedSubtitle, setSavedSubtitle] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [deletingIcon, setDeletingIcon] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSystemBranding()
      .then((b) => {
        setName(b.appName ?? "");
        setSubtitle(b.appSubtitle ?? "");
        setSavedName(b.appName ?? "");
        setSavedSubtitle(b.appSubtitle ?? "");
        setLogo(b.logo);
        setIcon(b.icon);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = name.trim() !== savedName || subtitle.trim() !== savedSubtitle;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSystemBranding({
        appName: name.trim() || null,
        appSubtitle: subtitle.trim() || null,
      });
      const n = result.appName ?? "";
      const s = result.appSubtitle ?? "";
      setName(n);
      setSubtitle(s);
      setSavedName(n);
      setSavedSubtitle(s);
      toast.success(t("branding.savedReload"));
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
      toast.success(t("branding.savedReload"));
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
      toast.success(t("branding.savedReload"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadIcon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      toast.error(t("branding.iconTooLarge"));
      return;
    }
    setUploadingIcon(true);
    try {
      const result = await uploadSystemIcon(file);
      setIcon(result.icon);
      toast.success(t("branding.savedReload"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setUploadingIcon(false);
      if (iconFileRef.current) iconFileRef.current.value = "";
    }
  };

  const handleDeleteIcon = async () => {
    setDeletingIcon(true);
    try {
      await deleteSystemIcon();
      setIcon(null);
      toast.success(t("branding.savedReload"));
    } catch {
      toast.error(t("branding.saveError"));
    } finally {
      setDeletingIcon(false);
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
        <FormInput label={t("branding.appName")} className="!mb-0">
          <Input value={name} onChange={setName} placeholder="Open Helpdesk" />
          <p className="text-exs text-muted mt-1">{t("branding.appNameHint")}</p>
        </FormInput>

        <FormInput label={t("branding.subtitle")} className="!mb-0">
          <Input value={subtitle} onChange={setSubtitle} placeholder="" />
          <p className="text-exs text-muted mt-1">{t("branding.subtitleHint")}</p>
        </FormInput>

        <div className="flex justify-end">
          <Button size="xs" loading={saving} onClick={handleSave} disabled={!hasChanges}>{t("branding.save")}</Button>
        </div>

        <div className="border-t border-border-card pt-4 mt-4">
          <p className="text-xs font-body-bold text-heading mb-2">{t("branding.logo")}</p>

          {logo && (
            <div className="flex items-center gap-3 mb-3">
              <BrandLogo src={logo} size="xl" className="rounded border border-border-card p-1" />
              <Button size="xs" color="danger" loading={deleting} onClick={handleDeleteLogo}>
                {t("branding.removeLogo")}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="xs" color="light" loading={uploading} onClick={() => fileRef.current?.click()}>
              {logo ? t("branding.changeLogo") : t("branding.uploadLogo")}
            </Button>
            <span className="text-exs text-muted">{t("adminBranding.logoHint")}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
        </div>

        <div className="border-t border-border-card pt-4 mt-4">
          <p className="text-xs font-body-bold text-heading mb-2">{t("branding.icon")}</p>
          <p className="text-exs text-muted mb-3">{t("branding.iconHint")}</p>

          {icon && (
            <div className="flex items-center gap-3 mb-3">
              <img src={icon} alt="" className="w-12 h-12 object-contain rounded border border-border-card p-1" />
              <Button size="xs" color="danger" loading={deletingIcon} onClick={handleDeleteIcon}>
                {t("branding.remove")}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="xs" color="light" loading={uploadingIcon} onClick={() => iconFileRef.current?.click()}>
              {icon ? t("branding.changeIcon") : t("branding.uploadIcon")}
            </Button>
            <span className="text-exs text-muted">PNG, SVG, JPEG, WebP. Max 512KB</span>
          </div>
          <input ref={iconFileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleUploadIcon} />
        </div>

        <div className="bg-surface-hover rounded-lg p-3 mt-4">
          <p className="text-exs text-muted">{t("adminBranding.note")}</p>
        </div>
      </div>
    </div>
  );
}
