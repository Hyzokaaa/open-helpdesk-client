import { useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import Input from "@modules/app/modules/ui/components/Input/Input";
import useTranslation from "@modules/app/i18n/useTranslation";
import { TranslationKey } from "@modules/app/i18n/translations";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { createExportToken, exportWorkspace } from "../services/workspace.service";
import { EXPORT_PASSWORD_MIN, ExportPasswordProblem, exportPasswordProblem, formatBytes } from "../domain/workspace-import";

/** A file downloaded now, or a single-use link another instance fetches later. */
export type ExportMode = "file" | "url";

interface Props {
  slug: string;
  mode: ExportMode;
  onClose: () => void;
}

const PROBLEM_LABELS: Record<ExportPasswordProblem, TranslationKey> = {
  tooShort: "workspaceExport.passwordTooShort",
  tooLong: "workspaceExport.passwordTooLong",
  mismatch: "workspaceExport.passwordMismatch",
};

function download(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export default function WorkspaceExportSheet({ slug, mode, onClose }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  // Bytes of the export received so far; 0 while the server is still preparing it
  const [downloaded, setDownloaded] = useState(0);
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const problem = exportPasswordProblem(password, confirmation);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (problem) return;
    setBusy(true);
    setDownloaded(0);
    try {
      if (mode === "file") {
        const { blob, filename } = await exportWorkspace(slug, password, (loaded) => setDownloaded(loaded));
        download(blob, filename);
        toast.success(t("workspaceSettings.exportSuccess"));
        onClose();
      } else {
        const res = await createExportToken(slug, password);
        setLink(res);
        try {
          await navigator.clipboard.writeText(res.url);
          toast.success(t("workspaceSettings.exportUrlCopied"));
        } catch { /* the link stays on screen to copy by hand */ }
      }
    } catch (err) {
      const e = err as HttpResponseError;
      if (e?.status === 400 && e.message) toast.error(e.message);
      else if (!e?.handled) toast.error(t(mode === "file" ? "workspaceSettings.exportError" : "workspaceSettings.exportUrlError"));
    } finally {
      setBusy(false);
    }
  };

  if (link) {
    return (
      <Sheet onClose={onClose} size="sm">
        <h3 className="text-base font-body-bold text-heading mb-3">{t("workspaceExport.linkTitle")}</h3>
        <p className="text-sm text-body break-all select-all rounded bg-surface px-3 py-2">{link.url}</p>
        <p className="text-xs text-muted mt-2">{t("workspaceExport.linkValidity")}</p>
        <p className="text-sm text-amber-800 dark:text-amber-300 mt-4">{t("workspaceExport.linkPasswordNote")}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button size="sm" color="light" onClick={async () => {
            try {
              await navigator.clipboard.writeText(link.url);
              toast.success(t("workspaceExport.linkCopied"));
            } catch { /* the link is selectable */ }
          }}>
            {t("workspaceExport.copyLink")}
          </Button>
          <Button size="sm" color="primary" onClick={onClose}>{t("workspaceImport.close")}</Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={busy ? () => {} : onClose} size="sm">
      <h3 className="text-base font-body-bold text-heading mb-1">
        {t(mode === "file" ? "workspaceExport.fileTitle" : "workspaceExport.urlTitle")}
      </h3>
      <p className="text-sm text-muted mb-4">{t("workspaceExport.intro")}</p>
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-3">
        <div>
          <label className="block text-xs text-subtle font-body-medium mb-1">{t("workspaceExport.password")}</label>
          <Input type="password" value={password} onChange={setPassword} disabled={busy} autoFocus />
          <p className="text-xs text-muted mt-1">
            {t("workspaceExport.passwordRule").replace("{min}", String(EXPORT_PASSWORD_MIN))}
          </p>
        </div>
        <div>
          <label className="block text-xs text-subtle font-body-medium mb-1">{t("workspaceExport.confirmPassword")}</label>
          <Input type="password" value={confirmation} onChange={setConfirmation} disabled={busy} />
        </div>
        {submitted && problem && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {t(PROBLEM_LABELS[problem]).replace("{min}", String(EXPORT_PASSWORD_MIN))}
          </p>
        )}
        <p className="text-sm text-amber-800 dark:text-amber-300">{t("workspaceExport.warning")}</p>
        {busy && mode === "file" && (
          <p className="text-sm text-muted" role="status" aria-live="polite">
            {t("workspaceExport.preparing")}
            {downloaded > 0 && (
              <span className="block text-xs mt-1">
                {t("workspaceExport.downloaded").replace("{size}", formatBytes(downloaded))}
              </span>
            )}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-3">
          <Button size="sm" color="light" onClick={onClose} disabled={busy}>{t("workspaceImport.cancel")}</Button>
          <Button size="sm" color="primary" type="submit" loading={busy}>
            {t(mode === "file" ? "workspaceExport.download" : "workspaceExport.generate")}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
