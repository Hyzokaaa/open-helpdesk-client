import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import useTranslation from "@modules/app/i18n/useTranslation";
import { TranslationKey } from "@modules/app/i18n/translations";
import { HttpResponseError } from "@modules/app/modules/http/domain/http";
import { ImportResult, importWorkspace, importWorkspaceFromUrl } from "../services/workspace.service";
import { getPalette, isCustomPalette } from "../domain/palettes";
import {
  IMPORT_SETTINGS,
  ImportFileSection,
  ImportResultCounter,
  ImportSetting,
  previewImportFile,
  summarizeImportResult,
  truncateText,
} from "../domain/workspace-import";

/** A parsed export file can be previewed; a URL is only fetched by the server. */
export type ImportSource = { kind: "file"; data: unknown } | { kind: "url"; url: string };

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
};

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
  const preview = useMemo(() => (source.kind === "file" ? previewImportFile(source.data) : null), [source]);
  // A URL file cannot be read here, so every setting is offered without a preview
  const offered = IMPORT_SETTINGS.filter((key) => !preview || preview.settings[key] !== undefined);
  const [selected, setSelected] = useState<Set<ImportSetting>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const toggle = (key: ImportSetting) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = source.kind === "file"
        ? await importWorkspace(slug, source.data, [...selected])
        : await importWorkspaceFromUrl(slug, source.url, [...selected]);
      setResult(res);
      onImported(res);
    } catch (err) {
      const e = err as HttpResponseError;
      if (e?.status === 400 && e.message) toast.error(e.message);
      else if (!e?.handled) toast.error(t("workspaceSettings.importError"));
    } finally {
      setImporting(false);
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
    if (key === "branding" && settings.branding) {
      return [settings.branding.appName, settings.branding.appSubtitle].filter(Boolean).join(" · ");
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
        {result.commentsSkipped > 0 && (
          <p className="mt-4 text-sm text-amber-800 dark:text-amber-300">
            {t("workspaceImport.commentsSkipped").replace("{count}", String(result.commentsSkipped))}
          </p>
        )}
        <div className="flex justify-end mt-6">
          <Button size="sm" color="primary" onClick={onClose}>{t("workspaceImport.close")}</Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={importing ? () => {} : onClose} size="sm">
      <h3 className="text-base font-body-bold text-heading mb-1">{t("workspaceImport.confirmTitle")}</h3>
      <p className="text-sm text-muted mb-4 break-all">
        {source.kind === "url" ? source.url : t("workspaceImport.confirmFile")}
      </p>

      {preview && (
        preview.sections.length === 0 ? (
          <p className="text-sm text-muted mb-4">{t("workspaceImport.fileEmpty")}</p>
        ) : (
          <ul className="space-y-1 text-sm mb-4">
            {preview.sections.map(({ section, count }) => (
              <li key={section} className="flex justify-between">
                <span className="text-muted">{t(SECTION_LABELS[section])}</span>
                <span className="text-body font-body-medium">{count}</span>
              </li>
            ))}
          </ul>
        )
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
          {importing ? t("workspaceSettings.importing") : t("workspaceImport.confirm")}
        </Button>
      </div>
    </Sheet>
  );
}
