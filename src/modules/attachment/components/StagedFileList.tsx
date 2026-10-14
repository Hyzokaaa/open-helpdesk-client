import clsx from "clsx";
import type { StagedFile } from "../hooks/useStagedUploads";
import { formatBytes } from "@modules/workspace/domain/workspace-import";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  files: StagedFile[];
  onRemove: (key: number) => void;
  onRetry: (key: number) => void;
}

/** Files added to a message that is still being written. */
export default function StagedFileList({ files, onRemove, onRetry }: Props) {
  const { t } = useTranslation();
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {files.map((f) => (
        <span
          key={f.key}
          className={clsx(
            "inline-flex items-center gap-2 rounded-lg border border-dashed px-2.5 py-1 text-xs max-w-64",
            f.status === "error" ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" : "border-primary/40 bg-primary-50 text-body dark:bg-primary/10",
          )}
        >
          {f.status === "uploading" && <Spinner width={12} />}
          <span className="truncate">{f.file.name}</span>
          <span className="text-subtle shrink-0">
            {f.status === "uploading" ? t("attachments.uploading") : formatBytes(f.file.size)}
          </span>
          {f.status === "error" && (
            <button type="button" onClick={() => onRetry(f.key)} className="underline cursor-pointer shrink-0">
              {t("attachments.retry")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(f.key)}
            aria-label={t("attachments.remove")}
            className="text-subtle hover:text-red-500 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
