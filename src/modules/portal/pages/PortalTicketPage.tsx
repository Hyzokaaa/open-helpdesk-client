import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import DropZone from "@modules/app/modules/ui/components/DropZone/DropZone";
import { useNavigate, useParams } from "react-router";
import { isPortalClosedError, portalLinkDashboardPath, portalSignInPath } from "../domain/portal-access";
import { toast } from "react-toastify";
import {
  getPortalTicket,
  addPortalComment,
  reopenPortalTicket,
  portalStageUpload,
  PortalTicketDetail,
  PortalTicketAttachment,
} from "../services/portal.service";
import useStagedUploads from "@modules/attachment/hooks/useStagedUploads";
import StagedFileList from "@modules/attachment/components/StagedFileList";
import { groupAttachments } from "@modules/attachment/domain/group-attachments";
import RichContent from "@modules/shared/components/RichContent";
import { formatCustomFieldValue } from "@modules/custom-field/domain/format-custom-field-value";
import {
  getPalette,
  DEFAULT_PALETTE,
  PaletteDefinition,
} from "@modules/workspace/domain/palettes";
import { needsDarkText } from "@modules/workspace/domain/color-scale";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import translations from "@modules/app/i18n/translations";

function t(key: string): string {
  const lang = LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) || navigator.language?.slice(0, 2) || "en";
  const entry = (translations as Record<string, Record<string, string>>)[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}

function applyPortalPalette(def: PaletteDefinition) {
  const root = document.documentElement;
  Object.entries(def.scale).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  root.style.setProperty("--palette-accent-rgb", def.accentRgb);
  const lightPrimary = needsDarkText(def.scale["600"]);
  root.style.setProperty("--color-primary-contrast", lightPrimary ? "#1f2937" : "#ffffff");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  discarded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const CATEGORY_BG = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

const isImage = (mimeType: string) => mimeType.startsWith("image/");
const isVideo = (mimeType: string) => mimeType.startsWith("video/");

/** Files of the ticket or of one reply: thumbnails for images and videos, a card for anything else. */
function PortalFiles({ files, small = false, onOpen }: {
  files: PortalTicketAttachment[];
  small?: boolean;
  onOpen: (file: PortalTicketAttachment) => void;
}) {
  if (files.length === 0) return null;
  const size = small ? "w-24 h-24" : "w-32 h-32";
  return (
    <div className={`flex flex-wrap ${small ? "gap-2 mt-2" : "gap-3"}`}>
      {files.map((att) => (
        <button
          key={att.id}
          type="button"
          onClick={() => onOpen(att)}
          title={att.originalName}
          className="block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
        >
          {isImage(att.mimeType) ? (
            <img src={att.downloadUrl} alt={att.originalName} className={`${size} object-cover`} />
          ) : isVideo(att.mimeType) ? (
            <video src={att.downloadUrl} className={`${size} object-cover`} />
          ) : (
            <div className={`${size} flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 gap-1`}>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center px-2 break-all line-clamp-2">
                {att.originalName}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {formatFileSize(att.size)}
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Under a resolved ticket: "Is it still not working?" with an explicit way to reopen it. A plain
 * reply below does not reopen it (a "thanks" must not), though the team is told of it. Past the
 * window, the requester is pointed to a new ticket instead.
 */
function PortalReopenPanel({ reopenUntil, newTicketPath, onReopen }: {
  reopenUntil: string | null;
  newTicketPath: string;
  onReopen: (message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  if (!reopenUntil) {
    return (
      <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {t("portalReopen.expired")}{" "}
        <a href={newTicketPath} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{t("portalReopen.newTicket")}</a>
      </div>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await onReopen(message.trim());
      toast.success(t("portalReopen.done"));
      setOpen(false);
      setMessage("");
    } catch {
      toast.error(t("portalReopen.error"));
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
      <p className="text-sm text-amber-900 dark:text-amber-200">{t("portalReopen.question")}</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-2 px-3 py-1.5 rounded-md text-sm font-medium border border-amber-600 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40 cursor-pointer">
          {t("portalReopen.notSolved")}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-3">
          <label htmlFor="portal-reopen-message" className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t("portalReopen.tellUs")}</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t("portalReopen.hint")}</p>
          <textarea
            id="portal-reopen-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-primary-400"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => { setOpen(false); setMessage(""); }} className="px-3 py-1.5 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              {t("portalReopen.cancel")}
            </button>
            <button type="submit" disabled={sending || !message.trim()} className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 cursor-pointer">
              {t("portalReopen.confirm")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function PortalTicketPage() {
  const { portalToken } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Files of the reply being written, uploaded to this portal as they are added
  const workspaceSlug = ticket?.workspaceSlug ?? "";
  const stageFile = useCallback((file: File) => portalStageUpload(workspaceSlug, file), [workspaceSlug]);
  const staged = useStagedUploads(stageFile);

  // Each file with the reply it came with; the rest belong to the ticket itself
  const files = useMemo(
    () => groupAttachments(ticket?.attachments ?? [], ticket?.comments.map((c) => c.id) ?? []),
    [ticket],
  );

  const openFile = (att: PortalTicketAttachment) => {
    if (isImage(att.mimeType) || isVideo(att.mimeType)) {
      setLightbox({ src: att.downloadUrl, type: isImage(att.mimeType) ? "image" : "video" });
    } else {
      window.open(att.downloadUrl, "_blank", "noopener");
    }
  };

  const fetchTicket = async () => {
    if (!portalToken) return;
    try {
      const data = await getPortalTicket(portalToken);
      setTicket(data);

      if (data.workspacePalette && data.workspacePalette !== DEFAULT_PALETTE) {
        const def = getPalette(data.workspacePalette);
        applyPortalPalette(def);
      }
    } catch (error) {
      // The portal was closed after this link was sent: its owner signs in and lands on the ticket
      if (isPortalClosedError(error)) {
        navigate(portalSignInPath({ notice: "portal-link", redirect: portalLinkDashboardPath(portalToken) }), { replace: true });
        return;
      }
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    return () => {
      const root = document.documentElement;
      const defaultDef = getPalette(DEFAULT_PALETTE);
      Object.keys(defaultDef.scale).forEach((shade) => {
        root.style.removeProperty(`--color-primary-${shade}`);
      });
      root.style.removeProperty("--palette-accent-rgb");
      root.style.removeProperty("--color-primary-contrast");
    };
  }, [portalToken]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalToken || !comment.trim() || staged.uploading) return;
    setSending(true);
    try {
      await addPortalComment(portalToken, comment.trim(), staged.tokens);
      setComment("");
      staged.clear();
      await fetchTicket();
    } catch {
      toast.error(t("portalTicket.commentError"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("portalTicket.notFound")}</p>
        </div>
      </div>
    );
  }

  // By the name of their field, as the customer cannot read the definitions
  const customFieldValues = ticket.customFieldValues ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:py-12">
      {lightbox && (
        <Lightbox
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticket.workspaceName}</h1>
        </div>

        {/* Ticket header card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-4">
          {/* Ticket number and meta */}
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="font-mono">{ticket.ticketNumber}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{formatDate(ticket.createdAt)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{ticket.reporterName}</span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {ticket.name}
          </h2>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
              {t(`enum.status.${ticket.status}`)}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium}`}>
              {t(`enum.priority.${ticket.priority}`)}
            </span>
            {ticket.categoryName && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BG}`}>
                {ticket.categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Description card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("portalTicket.description")}
          </h2>
          <RichContent
            content={ticket.description}
            className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
          />

          {/* Custom fields */}
          {customFieldValues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("portalTicket.customFields")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {customFieldValues.map((field) => (
                  <div key={field.name} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{field.name}: </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {formatCustomFieldValue(field.type, field.value, t)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files of the ticket itself; those of each reply show with the reply */}
          {files.ticket.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("portalTicket.attachments")} ({files.ticket.length})
              </h2>
              <PortalFiles files={files.ticket} onOpen={openFile} />
            </div>
          )}
        </div>

        {/* Comments section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t("portalTicket.comments")} ({ticket.comments.length})
          </h2>

          {ticket.comments.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("portalTicket.noComments")}
            </p>
          )}

          <div className="space-y-3 mb-6">
            {ticket.comments.map((c) => (
              <div
                key={c.id}
                className={`flex ${c.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    c.isOwn
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {c.authorName}
                    </span>
                    {c.isTeam && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {t("portalTicket.agent")}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <RichContent content={c.content} className="text-sm text-gray-700 dark:text-gray-300" />
                  <PortalFiles files={files.byComment.get(c.id) ?? []} small onOpen={openFile} />
                </div>
              </div>
            ))}
          </div>

          {/* Only the requester is offered to reopen it, or told it is too late */}
          {ticket.status === "resolved" && ticket.reopenUntil !== undefined && (
            <PortalReopenPanel
              reopenUntil={ticket.reopenUntil}
              newTicketPath={`/portal/${ticket.workspaceSlug}`}
              onReopen={async (message) => {
                if (!portalToken) return;
                await reopenPortalTicket(portalToken, message);
                await fetchTicket();
              }}
            />
          )}

          {/* Add comment */}
          <form onSubmit={handleSubmitComment}>
            <DropZone bare capturePaste={false} onFiles={staged.add} dropHint={t("drop.hint")}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onPaste={(e) => {
                  const pasted = Array.from(e.clipboardData?.files ?? []);
                  if (pasted.length === 0) return;
                  e.preventDefault();
                  staged.add(pasted);
                }}
                placeholder={t("portalTicket.commentPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-y"
              />
            </DropZone>
            <div className="mt-2 -mx-3">
              <StagedFileList files={staged.files} onRemove={staged.remove} onRetry={staged.retry} />
            </div>
            <div className="flex items-center gap-3 mt-1 mb-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) staged.add(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                {t("attachments.attach")}
              </button>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden sm:inline">{t("attachments.dropOrPaste")}</span>
            </div>
            <button
              type="submit"
              disabled={!comment.trim() || sending || staged.uploading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("portalTicket.sending")}
                </span>
              ) : (
                t("portalTicket.send")
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          {t("portal.poweredBy")}
        </p>
      </div>
    </div>
  );
}
