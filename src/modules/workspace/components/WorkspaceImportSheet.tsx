import { useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import Input from "@modules/app/modules/ui/components/Input/Input";
import useTranslation from "@modules/app/i18n/useTranslation";
import { TranslationKey } from "@modules/app/i18n/translations";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { ImportResult, ImportSource, importWorkspace, previewWorkspaceImport } from "../services/workspace.service";
import { getPalette, isCustomPalette } from "../domain/palettes";
import {
  brandingText,
  ImportFileSection,
  ImportPreview,
  ImportResultCounter,
  ImportResultWarning,
  ImportSetting,
  formatBytes,
  importWarnings,
  offeredSettings,
  previewFiles,
  previewSections,
  summarizeImportResult,
  transferPercent,
  truncateText,
} from "../domain/workspace-import";

interface Props {
  slug: string;
  source: ImportSource;
  onClose: () => void;
  onImported: (result: ImportResult) => void;
}

const SECTION_LABELS: Record<ImportFileSection, TranslationKey> = {
  tickets: "workspaceImport.section.tickets",
  comments: "workspaceImport.section.comments",
  users: "workspaceImport.section.users",
  categories: "workspaceImport.section.categories",
  organizations: "workspaceImport.section.organizations",
  departments: "workspaceImport.section.departments",
  projects: "workspaceImport.section.projects",
  kbArticles: "workspaceImport.section.kbArticles",
  customFields: "workspaceImport.section.customFields",
  cannedResponses: "workspaceImport.section.cannedResponses",
  attachments: "workspaceImport.section.attachments",
};

const WARNING_LABELS: Record<ImportResultWarning, TranslationKey> = {
  commentsSkipped: "workspaceImport.commentsSkipped",
  attachmentsSkipped: "workspaceImport.attachmentsSkipped",
};

/** Message for a failed preview or import, or null when the http layer already told the user. */
function failureMessage(e: HttpResponseError | undefined, fallback: string, tooLarge: string): string | null {
  if (e?.status === 413) return tooLarge;
  if (e?.status === 400 && e.message) return e.message;
  return e?.handled ? null : fallback;
}

const COUNTER_LABELS: Record<ImportResultCounter, TranslationKey> = {
  ticketsImported: "workspaceImport.result.ticketsImported",
  commentsImported: "workspaceImport.result.commentsImported",
  usersCreated: "workspaceImport.result.usersCreated",
  membersAdded: "workspaceImport.result.membersAdded",
  categoriesImported: "workspaceImport.result.categoriesImported",
  tagsImported: "workspaceImport.result.tagsImported",
  organizationsImported: "workspaceImport.result.organizationsImported",
  departmentsImported: "workspaceImport.result.departmentsImported",
  projectsImported: "workspaceImport.result.projectsImported",
  descriptionEditsImported: "workspaceImport.result.descriptionEditsImported",
  commentEditsImported: "workspaceImport.result.commentEditsImported",
  attachmentsImported: "workspaceImport.result.attachmentsImported",
  participantsImported: "workspaceImport.result.participantsImported",
  cannedResponsesImported: "workspaceImport.result.cannedResponsesImported",
  customFieldsImported: "workspaceImport.result.customFieldsImported",
  csatResponsesImported: "workspaceImport.result.csatResponsesImported",
  kbCategoriesImported: "workspaceImport.result.kbCategoriesImported",
  kbArticlesImported: "workspaceImport.result.kbArticlesImported",
  auditLogImported: "workspaceImport.result.auditLogImported",
};

const SETTING_LABELS: Record<ImportSetting, { overwrite: TranslationKey; applied: TranslationKey }> = {
  palette: { overwrite: "workspaceImport.overwrite.palette", applied: "workspaceImport.applied.palette" },
  sla: { overwrite: "workspaceImport.overwrite.sla", applied: "workspaceImport.applied.sla" },
  description: { overwrite: "workspaceImport.overwrite.description", applied: "workspaceImport.applied.description" },
  branding: { overwrite: "workspaceImport.overwrite.branding", applied: "workspaceImport.applied.branding" },
};

export default function WorkspaceImportSheet({ slug, source, onClose, onImported }: Props) {
  const { t, lang } = useTranslation();
  const [password, setPassword] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const offered = offeredSettings(preview?.settings);
  const [selected, setSelected] = useState<Set<ImportSetting>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  // Upload percentage of the running request; null when unknown or nothing is uploading
  const [uploaded, setUploaded] = useState<number | null>(null);
  const sourceLabel = source.kind === "url" ? source.url : source.file.name;
  // Only a file goes up with the request (twice: preview, then import); a URL is fetched by the server
  const trackUpload = source.kind === "file"
    ? (loaded: number, total: number | undefined) => setUploaded(transferPercent(loaded, total))
    : undefined;
  // Shown while the file is still going up; once it is all sent the server is working on it
  const uploadLabel = (label: string) =>
    uploaded !== null && uploaded < 100 ? t("workspaceImport.uploadProgress").replace("{percent}", String(uploaded)) : label;

  const handlePreview = async () => {
    setPreviewing(true);
    setPreviewError(null);
    setUploaded(null);
    try {
      setPreview(await previewWorkspaceImport(slug, source, password, trackUpload));
    } catch (err) {
      setPreviewError(failureMessage(err as HttpResponseError, t("workspaceImport.previewError"), t("workspaceImport.tooLarge")));
    } finally {
      setPreviewing(false);
      setUploaded(null);
    }
  };

  const toggle = (key: ImportSetting) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleImport = async () => {
    setImporting(true);
    setUploaded(null);
    try {
      const res = await importWorkspace(slug, source, password, [...selected], trackUpload);
      setResult(res);
      onImported(res);
    } catch (err) {
      const message = failureMessage(err as HttpResponseError, t("workspaceSettings.importError"), t("workspaceImport.tooLarge"));
      if (message) toast.error(message);
    } finally {
      setImporting(false);
      setUploaded(null);
    }
  };

  const renderPreview = (key: ImportSetting) => {
    const settings = preview?.settings;
    if (!settings) return null;
    if (key === "palette" && settings.palette) {
      const def = getPalette(settings.palette);
      const label = isCustomPalette(settings.palette) ? def.swatch : def.label[lang === "es" ? "es" : "en"];
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full border border-border-row" style={{ backgroundColor: def.swatch }} />
          {label}
        </span>
      );
    }
    if (key === "sla") return t("workspaceImport.preview.sla");
    if (key === "description" && settings.description) return `“${truncateText(settings.description, 120)}”`;
    if (key === "branding") {
      return brandingText(settings.branding, {
        logo: t("workspaceImport.preview.logo"),
        icon: t("workspaceImport.preview.icon"),
      }) || null;
    }
    return null;
  };

  if (result) {
    const counters = summarizeImportResult(result);
    const applied = result.settingsApplied ?? [];
    return (
      <Sheet onClose={onClose} size="sm">
        <h3 className="text-base font-body-bold text-heading mb-3">{t("workspaceSettings.importSuccess")}</h3>
        {counters.length === 0 ? (
          <p className="text-sm text-muted">{t("workspaceImport.nothingImported")}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {counters.map(({ counter, count }) => (
              <li key={counter} className="flex justify-between">
                <span className="text-muted">{t(COUNTER_LABELS[counter])}</span>
                <span className="text-body font-body-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-subtle font-body-medium mt-4 mb-1">{t("workspaceImport.settingsTitle")}</p>
        <p className="text-sm text-body">
          {applied.length ? applied.map((key) => t(SETTING_LABELS[key].applied)).join(", ") : t("workspaceImport.noSettingsApplied")}
        </p>
        {importWarnings(result).map(({ warning, count }) => (
          <p key={warning} className="mt-4 text-sm text-amber-800 dark:text-amber-300">
            {t(WARNING_LABELS[warning]).replace("{count}", String(count))}
          </p>
        ))}
        <div className="flex justify-end mt-6">
          <Button size="sm" color="primary" onClick={onClose}>{t("workspaceImport.close")}</Button>
        </div>
      </Sheet>
    );
  }

  if (!preview) {
    return (
      <Sheet onClose={previewing ? () => {} : onClose} size="sm">
        <h3 className="text-base font-body-bold text-heading mb-1">{t("workspaceImport.confirmTitle")}</h3>
        <p className="text-sm text-muted mb-4 break-all">{sourceLabel}</p>
        <form onSubmit={(e) => { e.preventDefault(); void handlePreview(); }}>
          <label className="block text-xs text-subtle font-body-medium mb-1">{t("workspaceImport.password")}</label>
          <Input type="password" value={password} onChange={(v) => { setPassword(v); setPreviewError(null); }} disabled={previewing} autoFocus />
          <p className="text-xs text-muted mt-1">{t("workspaceImport.passwordHint")}</p>
          {previewError && <p className="text-sm text-red-600 dark:text-red-400 mt-3" role="alert">{previewError}</p>}
          <div className="flex justify-end gap-2 mt-6">
            <Button size="sm" color="light" onClick={onClose} disabled={previewing}>{t("workspaceImport.cancel")}</Button>
            <Button size="sm" color="primary" type="submit" loading={previewing}>{uploadLabel(t("workspaceImport.continue"))}</Button>
          </div>
        </form>
      </Sheet>
    );
  }

  const sections = previewSections(preview);
  const files = previewFiles(preview);

  return (
    <Sheet onClose={importing ? () => {} : onClose} size="sm">
      <h3 className="text-base font-body-bold text-heading mb-1">{t("workspaceImport.confirmTitle")}</h3>
      <p className="text-sm text-muted mb-1 break-all">{sourceLabel}</p>
      <p className="text-sm text-muted mb-4">{t("workspaceImport.confirmFile")}</p>

      {sections.length === 0 ? (
          <p className="text-sm text-muted mb-4">{t("workspaceImport.fileEmpty")}</p>
        ) : (
          <ul className="space-y-1 text-sm mb-4">
            {sections.map(({ section, count }) => (
              <li key={section} className="flex justify-between">
                <span className="text-muted">{t(SECTION_LABELS[section])}</span>
                <span className="text-body font-body-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
      {files && (
        <p className="text-sm text-muted mb-4">
          {t("workspaceImport.files").replace("{count}", String(files.files)).replace("{size}", formatBytes(files.bytes))}
        </p>
      )}

      <p className="text-xs text-subtle font-body-medium mb-1">{t("workspaceImport.settingsTitle")}</p>
      {offered.length === 0 ? (
        <p className="text-sm text-muted">{t("workspaceImport.noSettingsInFile")}</p>
      ) : (
        <>
          <p className="text-xs text-muted mb-2">{t("workspaceImport.settingsHint")}</p>
          <div className="space-y-2">
            {offered.map((key) => {
              const detail = renderPreview(key);
              return (
                <label key={key} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggle(key)}
                    disabled={importing}
                    className="w-4 h-4 mt-0.5 accent-primary"
                  />
                  <span className="text-sm min-w-0">
                    <span className="text-body">{t(SETTING_LABELS[key].overwrite)}</span>
                    {detail && <span className="block text-xs text-muted break-words">{detail}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button size="sm" color="light" onClick={onClose} disabled={importing}>{t("workspaceImport.cancel")}</Button>
        <Button size="sm" color="primary" onClick={handleImport} loading={importing}>
          {importing ? uploadLabel(t("workspaceSettings.importing")) : t("workspaceImport.confirm")}
        </Button>
      </div>
    </Sheet>
  );
}
