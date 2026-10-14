import clsx from "clsx";
import { sanitizeHtml } from "@modules/app/security/sanitize-html";
import { escapeHtml, renderMentions, type MentionMember } from "@modules/ticket/domain/render-mentions";
import { isRichText } from "../domain/rich-text";

interface Props {
  /** A description or comment as stored: editor HTML, or plain text from email and older tickets. */
  content: string;
  /** Members to name mentions by; without them a mention shows the name it was written with. */
  members?: readonly MentionMember[];
  className?: string;
}

/**
 * Shows stored ticket text the same way everywhere: editor HTML sanitized with mentions
 * highlighted, plain text escaped with its line breaks kept. Never shows raw markup.
 */
export default function RichContent({ content, members = [], className }: Props) {
  const rich = isRichText(content);
  const html = rich ? renderMentions(content, members) : renderMentions(escapeHtml(content), members);
  return (
    <div
      className={clsx("break-words", rich ? "tiptap" : "whitespace-pre-wrap", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
