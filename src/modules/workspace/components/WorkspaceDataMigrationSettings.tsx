import { useRef, useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import useTranslation from "@modules/app/i18n/useTranslation";
import { ImportResult, ImportSource } from "../services/workspace.service";
import WorkspaceImportSheet from "./WorkspaceImportSheet";
import WorkspaceExportSheet, { ExportMode } from "./WorkspaceExportSheet";

interface Props {
  slug: string;
  onImported: (result: ImportResult) => void;
}

/** Export the workspace to a file or a link, and import one from another installation. */
export default function WorkspaceDataMigrationSettings({ slug, onImported }: Props) {
  const { t } = useTranslation();
  const [exportMode, setExportMode] = useState<ExportMode | null>(null);
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const importFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-body-semibold text-heading mb-1">{t("workspaceSettings.export")}</h3>
        <p className="text-xs text-muted mb-2">{t("workspaceSettings.exportDesc")}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="xs" color="light" onClick={() => setExportMode("file")}>
            {t("workspaceSettings.export")}
          </Button>
          <Button size="xs" color="light" onClick={() => setExportMode("url")}>
            {t("workspaceSettings.exportUrl")}
          </Button>
        </div>
      </div>

      {exportMode && (
        <WorkspaceExportSheet slug={slug} mode={exportMode} onClose={() => setExportMode(null)} />
      )}

      <hr className="border-border-row" />

      <div>
        <h3 className="text-sm font-body-semibold text-heading mb-1">{t("workspaceSettings.import")}</h3>
        <p className="text-xs text-muted mb-2">{t("workspaceSettings.importDesc")}</p>
        <input ref={importFileRef} type="file" accept=".ohd,.json" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) setImportSource({ kind: "file", file });
        }} />
        <div className="flex gap-2">
          <Button size="xs" color="light" onClick={() => importFileRef.current?.click()}>
            {t("workspaceSettings.import")}
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <Input value={importUrl} onChange={setImportUrl} size="sm" placeholder={t("workspaceSettings.importUrlPlaceholder")} />
          <Button size="xs" color="light" disabled={!importUrl.trim()} onClick={() => setImportSource({ kind: "url", url: importUrl.trim() })}>
            {t("workspaceSettings.importUrl")}
          </Button>
        </div>
        {importSource && (
          <WorkspaceImportSheet
            slug={slug}
            source={importSource}
            onClose={() => setImportSource(null)}
            onImported={(result) => {
              if (importSource.kind === "url") setImportUrl("");
              onImported(result);
            }}
          />
        )}
      </div>
    </div>
  );
}
