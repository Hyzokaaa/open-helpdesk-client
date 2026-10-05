/**
 * Turns the `@[Name](userId)` mention markup stored in comments into the
 * highlighted span the ticket page renders.
 *
 * The output is HTML that goes through `dangerouslySetInnerHTML`, so the
 * display name — which comes from user-controlled profile fields — is escaped
 * before it is interpolated. The caller must still pass the result through
 * `sanitizeHtml` before rendering: this function only guarantees the name
 * cannot break out of the span, not that `content` itself is safe.
 */

export interface MentionMember {
  userId: string;
  firstName: string;
  lastName: string;
}

const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

export const MENTION_CLASS =
  "inline-block bg-primary-50 text-primary font-body-semibold rounded px-0.5 mx-0.5";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function renderMentions(content: string, members: readonly MentionMember[]): string {
  return content.replace(MENTION_REGEX, (_match, storedName: string, userId: string) => {
    const current = members.find((m) => m.userId === userId);
    const displayName = current ? `${current.firstName} ${current.lastName}` : storedName;
    return `<span class="${MENTION_CLASS}">@${escapeHtml(displayName)}</span>`;
  });
}
