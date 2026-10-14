/**
 * The whole story of a ticket in one chronological list, for the Activity tab: how it was
 * opened, every comment, files added later and the changes in between.
 *
 * Comments and files come from their own records, so the activity entries that only repeat them
 * (comment created, file uploaded, ticket created) are left out. Changes made by one person
 * within a few minutes of each other, with nothing in between, read as a single line.
 */

export interface TimelineActivity {
  id: string;
  action: string;
  userId: string | null;
  createdAt: string;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface TimelineComment {
  id: string;
  authorId: string;
  createdAt: string | null;
}

export interface TimelineFile {
  id: string;
  commentId: string | null;
  createdAt: string | null;
  uploadedBy: { id: string } | null;
}

export type TimelineEntry<C extends TimelineComment = TimelineComment, F extends TimelineFile = TimelineFile> =
  | { kind: "opening"; at: string; authorId: string; via: "email" | "portal" | null; files: F[] }
  | { kind: "comment"; at: string; comment: C; files: F[] }
  | { kind: "files"; at: string; authorId: string | null; files: F[] }
  | { kind: "changes"; at: string; authorId: string | null; items: TimelineActivity[] };

/** Entries already told by the comments, files and opening card. */
const SHOWN_ELSEWHERE = new Set([
  "ticket-created",
  "portal-ticket-created",
  "comment-created",
  "portal-comment-created",
  "attachment-uploaded",
]);

/** Changes this close to the previous one, by the same person, join its line. */
export const GROUP_WINDOW_MS = 10 * 60 * 1000;
/** Files saved this close to the ticket were part of opening it. */
const OPENING_GRACE_MS = 5 * 60 * 1000;

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);
const authorOf = (entry: TimelineEntry<TimelineComment, TimelineFile>) => (entry.kind === "comment" ? entry.comment.authorId : entry.authorId);

interface Input<C extends TimelineComment, F extends TimelineFile> {
  ticket: { reporterId: string; createdAt: string | null };
  comments: C[];
  files: F[];
  activity: TimelineActivity[];
}

export function buildTicketTimeline<C extends TimelineComment, F extends TimelineFile>(
  input: Input<C, F>,
): TimelineEntry<C, F>[] {
  const openedAt = input.ticket.createdAt ?? input.activity[0]?.createdAt ?? new Date(0).toISOString();
  const created = input.activity.find((a) => a.action === "ticket-created" || a.action === "portal-ticket-created");
  const via = created?.action === "portal-ticket-created" ? "portal" : created?.source === "email" ? "email" : null;

  const commentIds = new Set(input.comments.map((c) => c.id));
  const ticketFiles = input.files.filter((f) => !f.commentId || !commentIds.has(f.commentId));
  const openingFiles = ticketFiles.filter((f) => time(f.createdAt) - time(openedAt) <= OPENING_GRACE_MS);
  const laterFiles = ticketFiles.filter((f) => !openingFiles.includes(f));

  const rest: TimelineEntry<C, F>[] = [
    ...input.comments.map((comment) => ({
      kind: "comment" as const,
      at: comment.createdAt ?? openedAt,
      comment,
      files: input.files.filter((f) => f.commentId === comment.id),
    })),
    ...laterFiles.map((file) => ({ kind: "files" as const, at: file.createdAt ?? openedAt, authorId: file.uploadedBy?.id ?? null, files: [file] })),
    ...input.activity
      .filter((a) => !SHOWN_ELSEWHERE.has(a.action))
      .map((a) => ({ kind: "changes" as const, at: a.createdAt, authorId: a.userId, items: [a] })),
  ];
  rest.sort((a, b) => time(a.at) - time(b.at));

  const merged: TimelineEntry<C, F>[] = [];
  for (const entry of rest) {
    const last = merged[merged.length - 1];
    const lastAt = last ? time(last.kind === "changes" ? last.items[last.items.length - 1].createdAt : last.at) : 0;
    const close = !!last && authorOf(last) === authorOf(entry) && time(entry.at) - lastAt <= GROUP_WINDOW_MS;
    if (close && last.kind === "changes" && entry.kind === "changes") {
      last.items.push(...entry.items);
    } else if (close && last.kind === "files" && entry.kind === "files") {
      last.files.push(...entry.files);
    } else {
      merged.push(entry);
    }
  }

  return [{ kind: "opening", at: openedAt, authorId: input.ticket.reporterId, via, files: openingFiles }, ...merged];
}
