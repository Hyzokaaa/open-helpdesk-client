import { useEffect, useState } from "react";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import {
  getPortalTicket,
  addPortalComment,
  PortalTicketDetail,
} from "../services/portal.service";
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

export default function PortalTicketPage() {
  const { portalToken } = useParams();
  const [ticket, setTicket] = useState<PortalTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);

  const fetchTicket = async () => {
    if (!portalToken) return;
    try {
      const data = await getPortalTicket(portalToken);
      setTicket(data);

      if (data.workspacePalette && data.workspacePalette !== DEFAULT_PALETTE) {
        const def = getPalette(data.workspacePalette);
        applyPortalPalette(def);
      }
    } catch {
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
    if (!portalToken || !comment.trim()) return;
    setSending(true);
    try {
      await addPortalComment(portalToken, comment.trim());
      setComment("");
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

  const customFieldEntries = Object.entries(ticket.customFields || {});
  const isImage = (mimeType: string) => mimeType.startsWith("image/");
  const isVideo = (mimeType: string) => mimeType.startsWith("video/");

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
            <span className="font-mono">#{ticket.ticketNumber}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{formatDate(ticket.createdAt)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{ticket.creatorName}</span>
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
          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {ticket.description}
          </div>

          {/* Custom fields */}
          {customFieldEntries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("portalTicket.customFields")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {customFieldEntries.map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{key}: </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {Array.isArray(value) ? value.join(", ") : String(value ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("portalTicket.attachments")} ({ticket.attachments.length})
              </h2>
              <div className="flex flex-wrap gap-3">
                {ticket.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() =>
                      isImage(att.mimeType) || isVideo(att.mimeType)
                        ? setLightbox({
                            src: att.downloadUrl,
                            type: isImage(att.mimeType) ? "image" : "video",
                          })
                        : window.open(att.downloadUrl, "_blank")
                    }
                    className="block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
                  >
                    {isImage(att.mimeType) ? (
                      <img
                        src={att.downloadUrl}
                        alt={att.originalName}
                        className="w-32 h-32 object-cover"
                      />
                    ) : isVideo(att.mimeType) ? (
                      <video
                        src={att.downloadUrl}
                        className="w-32 h-32 object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 gap-1">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center px-2 break-all">
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
                className={`flex ${c.isCreator ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    c.isCreator
                      ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {c.authorName}
                    </span>
                    {!c.isCreator && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {t("portalTicket.agent")}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("portalTicket.commentPlaceholder")}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-y mb-3"
            />
            <button
              type="submit"
              disabled={!comment.trim() || sending}
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
