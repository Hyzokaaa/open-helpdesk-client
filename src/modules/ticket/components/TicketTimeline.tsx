import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import Card from "@modules/app/modules/ui/components/Card/Card";
import UserAvatar from "@modules/user/components/UserAvatar";
import RichContent from "@modules/shared/components/RichContent";
import { htmlToText } from "@modules/shared/domain/rich-text";
import AttachmentList from "@modules/attachment/components/AttachmentList";
import type { TicketAttachment } from "@modules/attachment/services/attachment.service";
import { AuditLogItem, listTicketActivity } from "@modules/audit-log/services/audit-log.service";
import { describeTicketActivity } from "@modules/audit-log/domain/describe-ticket-activity";
import type { MentionMember } from "../domain/render-mentions";
import { buildTicketTimeline } from "../domain/build-ticket-timeline";

interface Person {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface TimelineCommentItem {
  id: string;
  authorId: string;
  content: string;
  createdAt: string | null;
}

interface Props {
  workspaceSlug: string;
  ticket: { id: string; description: string; reporterId: string; createdAt: string | null };
  comments: TimelineCommentItem[];
  attachments: TicketAttachment[];
  members: readonly MentionMember[];
  getPerson: (userId: string) => Person | undefined;
  onOpenAttachment: (attachment: TicketAttachment) => void;
  /** Takes the reader to the Details tab, where the conversation is answered. */
  onGoToDetails: () => void;
  refreshKey?: number;
}

/** Texts longer than this start folded, so the story reads at a glance. */
const FOLD_AFTER_CHARS = 400;
/** How much of a message the summary shows. */
const SUMMARY_CHARS = 140;
const SUMMARY_KEY = "ticketTimeline.summary";

function Folded({ content, members }: { content: string; members: readonly MentionMember[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const long = htmlToText(content).length > FOLD_AFTER_CHARS;
  return (
    <div>
      <div className={long && !open ? "max-h-28 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" : undefined}>
        <RichContent content={content} members={members} className="text-sm text-body" />
      </div>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="text-xs text-primary hover:underline mt-1 cursor-pointer">
          {open ? t("auditLog.feed.showLess") : t("timeline.showMore")}
        </button>
      )}
    </div>
  );
}

/**
 * The Activity tab: the whole story of the ticket, read-only. The opening request, every comment
 * with its files, and the changes in between as short lines. Answering happens in Details.
 */
export default function TicketTimeline({ workspaceSlug, ticket, comments, attachments, members, getPerson, onOpenAttachment, onGoToDetails, refreshKey }: Props) {
  const { t, tEnum } = useTranslation();
  const { isPlanLimitError } = useExtensions();
  const formatDate = useFormatDate();
  const [activity, setActivity] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  // Summary shows each message as one line; remembered in this browser only
  const [summary, setSummary] = useState(() => {
    try { return localStorage.getItem(SUMMARY_KEY) === "1"; } catch { return false; }
  });
  const chooseSummary = (value: boolean) => {
    setSummary(value);
    try { localStorage.setItem(SUMMARY_KEY, value ? "1" : "0"); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    listTicketActivity(workspaceSlug, ticket.id)
      .then((items) => { setActivity(items); setLocked(false); })
      .catch((err) => { if (isPlanLimitError(err)) setLocked(true); })
      .finally(() => setLoading(false));
  }, [workspaceSlug, ticket.id, refreshKey]);

  const timeline = useMemo(
    () => buildTicketTimeline({ ticket, comments, files: attachments, activity }),
    [ticket, comments, attachments, activity],
  );

  // People who left the workspace are named from the activity entries
  const knownNames = new Map(activity.filter((i) => i.userId && i.userName).map((i) => [i.userId as string, i.userName as string]));
  const nameOf = (userId: string | null) => {
    if (!userId) return t("auditLog.system");
    const p = getPerson(userId);
    if (p) return `${p.firstName} ${p.lastName}`.trim();
    const name = knownNames.get(userId);
    return name ? `${name} (${t("auditLog.formerMember")})` : t("auditLog.system");
  };
  const avatar = (userId: string | null, size: "xs" | "sm") => {
    const p = userId ? getPerson(userId) : undefined;
    return <UserAvatar avatarUrl={p?.avatarUrl} firstName={p?.firstName ?? nameOf(userId)} lastName={p?.lastName} size={size} />;
  };

  if (loading) return null;
  if (locked) {
    return (
      <div className="flex items-center gap-3 py-3">
        <svg className="w-4 h-4 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <div>
          <p className="text-xs text-muted">{t("auditLog.feed.locked")}</p>
          <Link to="/dashboard/settings/billing" className="text-xs text-primary hover:underline">
            {t("planLimit.upgradeToUnlock")}
          </Link>
        </div>
      </div>
    );
  }

  const modeButton = (value: boolean, label: string) => (
    <button
      type="button"
      onClick={() => chooseSummary(value)}
      aria-pressed={summary === value}
      className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${summary === value ? "bg-surface text-heading shadow-sm" : "text-muted hover:text-body"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="inline-flex bg-surface-hover rounded-full p-0.5 text-xs">
          {modeButton(false, t("timeline.full"))}
          {modeButton(true, t("timeline.summary"))}
        </div>
      </div>
      <div className="relative ml-1 pl-5 space-y-3 border-l-2 border-border-input">
        {timeline.map((entry, index) => {
          if (entry.kind === "opening" || entry.kind === "comment") {
            const authorId = entry.kind === "opening" ? entry.authorId : entry.comment.authorId;
            const via = entry.kind === "opening" && entry.via ? ` ${t(entry.via === "email" ? "auditLog.feed.viaEmail" : "auditLog.feed.viaPortal")}` : "";
            if (summary) {
              const text = htmlToText(entry.kind === "opening" ? ticket.description : entry.comment.content);
              const excerpt = text.length > SUMMARY_CHARS ? `${text.slice(0, SUMMARY_CHARS).trimEnd()}…` : text;
              return (
                <div key={entry.kind === "comment" ? entry.comment.id : "opening"} className="relative">
                  <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
                  <div className="flex items-start gap-2 text-xs">
                    {avatar(authorId, "xs")}
                    <p className="min-w-0 flex-1 text-muted">
                      <span className="font-body-semibold text-body">{nameOf(authorId)}</span>
                      {entry.kind === "opening" && <> {t("timeline.opened")}{via}</>}
                      : <span className="text-body">{excerpt}</span>
                      {entry.files.length > 0 && <span className="ml-1 whitespace-nowrap">· 📎 {entry.files.length}</span>}
                    </p>
                    <span className="text-exs text-subtle shrink-0">{formatDate(entry.at)}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={entry.kind === "comment" ? entry.comment.id : "opening"} className="relative">
                <span className="absolute -left-[26px] top-5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface" />
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {avatar(authorId, "sm")}
                    <p className="text-xs text-body font-body-semibold">{nameOf(authorId)}</p>
                    {entry.kind === "opening" && <p className="text-xs text-muted">{t("timeline.opened")}{via}</p>}
                    <p className="text-exs text-subtle ml-auto">{formatDate(entry.at)}</p>
                  </div>
                  <Folded content={entry.kind === "opening" ? ticket.description : entry.comment.content} members={members} />
                  <AttachmentList attachments={entry.files} onOpen={onOpenAttachment} />
                </Card>
              </div>
            );
          }
          if (entry.kind === "reopened") {
            const meta = (entry.activity.metadata ?? {}) as { reason?: string; note?: string; previousResolvedBy?: string | null; reopenCount?: number; before?: { status?: string }; after?: { status?: string } };
            // People are stored as "Name (email)"; the name reads enough here
            const previousResolver = meta.previousResolvedBy ? String(meta.previousResolvedBy).replace(/s*([^()]*@[^()]*)s*$/, "") : null;
            const label = <span className="font-body-semibold text-amber-800 dark:text-amber-300">{t("timeline.reopened")}{meta.reopenCount ? ` · ${t("reopen.badge").replace("{count}", String(meta.reopenCount))}` : ""}</span>;
            return (
              <div key={entry.activity.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-surface" />
                {summary ? (
                  <div className="flex items-start gap-2 text-xs text-muted">
                    {avatar(entry.authorId, "xs")}
                    <p className="min-w-0 flex-1">
                      <span className="font-body-semibold text-body">{nameOf(entry.authorId)}</span> {label}
                      {meta.reason && <> · {tEnum("reopenReason", meta.reason)}</>}
                    </p>
                    <span className="text-exs text-subtle shrink-0">{formatDate(entry.at)}</span>
                  </div>
                ) : (
                  <Card className="p-3 border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      {avatar(entry.authorId, "sm")}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="text-body"><span className="font-body-semibold">{nameOf(entry.authorId)}</span> {label}</p>
                        {meta.reason && <p className="text-xs text-secondary-text mt-0.5">{tEnum("reopenReason", meta.reason)}{meta.before?.status && meta.after?.status && <> · {tEnum("status", meta.before.status)} → {tEnum("status", meta.after.status)}</>}</p>}
                        {meta.note && <p className="text-sm text-body mt-1.5 whitespace-pre-wrap">"{meta.note}"</p>}
                        {previousResolver && <p className="text-xs text-muted mt-1.5">{t("resolution.hadResolved").replace("{name}", previousResolver)}</p>}
                      </div>
                      <span className="text-exs text-subtle shrink-0">{formatDate(entry.at)}</span>
                    </div>
                  </Card>
                )}
              </div>
            );
          }
          if (entry.kind === "files") {
            return (
              <div key={`files-${index}`} className="relative">
                <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-subtle" />
                <div className="flex items-start gap-2 text-xs text-muted">
                  {avatar(entry.authorId, "xs")}
                  <div className="min-w-0 flex-1">
                    <p><span className="font-body-semibold text-body">{nameOf(entry.authorId)}</span> {t("timeline.addedFiles")}</p>
                    <AttachmentList attachments={entry.files} onOpen={onOpenAttachment} />
                  </div>
                  <span className="text-exs text-subtle shrink-0">{formatDate(entry.at)}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={entry.items[0].id} className="relative">
              <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface border-2 border-subtle" />
              <div className="flex items-start gap-2 text-xs text-muted">
                {avatar(entry.authorId, "xs")}
                <p className="min-w-0 flex-1">
                  <span className="font-body-semibold text-body">{nameOf(entry.authorId)}</span>{" "}
                  {entry.items.map((item) => describeTicketActivity(item, t as (k: string) => string, tEnum)).join(" · ")}
                </p>
                <span className="text-exs text-subtle shrink-0">{formatDate(entry.at)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-subtle mt-4">
        {t("timeline.readOnly")}{" "}
        <button type="button" onClick={onGoToDetails} className="text-primary hover:underline cursor-pointer">
          {t("ticketDetail.details")}
        </button>
      </p>
    </div>
  );
}
