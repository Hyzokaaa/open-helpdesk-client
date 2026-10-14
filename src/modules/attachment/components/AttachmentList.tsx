import type { TicketAttachment } from "../services/attachment.service";
import { formatBytes } from "@modules/workspace/domain/workspace-import";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";

interface Props {
  attachments: TicketAttachment[];
  /** Opens a file: images and videos in the lightbox, anything else in a new tab. */
  onOpen: (attachment: TicketAttachment) => void;
  /** Shown on files the caller may delete. */
  onDelete?: (attachment: TicketAttachment) => void;
  /** Adds who uploaded a file and when, for files whose place does not say it already. */
  showUploader?: boolean | ((attachment: TicketAttachment) => boolean);
  /** "rows" lists one file per line with its details, for an overview of every file. */
  variant?: "tiles" | "rows";
}

export const isImage = (mimeType: string) => mimeType.startsWith("image/");
export const isVideo = (mimeType: string) => mimeType.startsWith("video/");

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1, dot + 5).toUpperCase() : "FILE";
}

export default function AttachmentList({ attachments, onOpen, onDelete, showUploader = false, variant = "tiles" }: Props) {
  const { t } = useTranslation();
  const formatDate = useFormatDate();
  if (attachments.length === 0) return null;

  const uploaderLine = (a: TicketAttachment) => {
    const name = a.uploadedBy ? `${a.uploadedBy.firstName} ${a.uploadedBy.lastName}`.trim() : null;
    const date = a.createdAt ? formatDate(a.createdAt) : null;
    if (!name && !date) return null;
    return [name ? `${t("attachments.addedBy")} ${name}` : null, date].filter(Boolean).join(" · ");
  };

  if (variant === "rows") {
    return (
      <ul className="divide-y divide-border-row">
        {attachments.map((a) => {
          const withUploader = typeof showUploader === "function" ? showUploader(a) : showUploader;
          const meta = withUploader ? uploaderLine(a) : null;
          return (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <button type="button" onClick={() => onOpen(a)} className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group">
                {isImage(a.mimeType) ? (
                  <img src={a.downloadUrl} alt={a.originalName} className="w-9 h-9 rounded-md object-cover border border-border-input shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-md bg-surface-hover text-muted text-[10px] font-body-semibold flex items-center justify-center shrink-0">
                    {isVideo(a.mimeType) ? "VID" : extensionOf(a.originalName)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-sm text-body truncate group-hover:text-primary">{a.originalName}</span>
                  <span className="block text-exs text-subtle truncate">{[formatBytes(a.size), meta].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
              {onDelete && a.canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(a)}
                  aria-label={t("attachments.delete")}
                  className="text-subtle hover:text-red-500 text-xs cursor-pointer shrink-0"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {attachments.map((a) => {
        const withUploader = typeof showUploader === "function" ? showUploader(a) : showUploader;
        const meta = withUploader ? uploaderLine(a) : null;
        const title = [a.originalName, formatBytes(a.size), meta].filter(Boolean).join(" · ");
        return (
          <div key={a.id}>
            <div className="relative group w-fit">
              <button
                type="button"
                onClick={() => onOpen(a)}
                title={title}
                className="block border border-border-input rounded-lg overflow-hidden hover:border-primary-300 transition-colors cursor-pointer bg-surface text-left"
              >
                {isImage(a.mimeType) ? (
                  <img src={a.downloadUrl} alt={a.originalName} className="w-28 h-20 object-cover" />
                ) : isVideo(a.mimeType) ? (
                  <video src={a.downloadUrl} className="w-28 h-20 object-cover" />
                ) : (
                  <span className="flex items-center gap-2 px-2.5 py-2 max-w-64">
                    <span className="shrink-0 w-8 h-8 rounded-md bg-surface-hover text-muted text-[10px] font-body-semibold flex items-center justify-center">
                      {extensionOf(a.originalName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-body truncate">{a.originalName}</span>
                      <span className="block text-exs text-subtle">{formatBytes(a.size)}</span>
                    </span>
                  </span>
                )}
              </button>
              {onDelete && a.canDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(a); }}
                  aria-label={t("attachments.delete")}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
            {meta && <p className="text-exs text-subtle mt-0.5 max-w-64 truncate">{meta}</p>}
          </div>
        );
      })}
    </div>
  );
}
