/**
 * Ticket descriptions, comments, canned responses and articles are written in the rich text
 * editor and stored as HTML; older and emailed ones can be plain text. These helpers let any
 * screen tell them apart and turn the HTML into text where markup cannot be shown.
 */

/** The markup mentions are stored in: `@[Display Name](userId)`. */
const MENTION_MARKUP = /@\[([^\]]+)\]\([^)]+\)/g;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function safeFromCodePoint(code: number, fallback: string): string {
  try {
    return Number.isFinite(code) ? String.fromCodePoint(code) : fallback;
  } catch {
    return fallback;
  }
}

/** Decodes the named entities rich text commonly holds and any numeric one. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    const lower = code.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return safeFromCodePoint(parseInt(lower.slice(2), 16), match);
    if (lower.startsWith("#")) return safeFromCodePoint(parseInt(lower.slice(1), 10), match);
    return match;
  });
}

/** Whether a stored text holds editor markup rather than plain text. */
export function isRichText(content: string | null | undefined): boolean {
  return /<[a-z][^>]*>/i.test(content ?? "");
}

/**
 * Reduces rich text to one readable line: mentions read as `@Name`, block boundaries and line
 * breaks become spaces, every tag is removed, entities are decoded and whitespace collapses.
 */
export function htmlToText(input: string): string {
  return decodeEntities(
    input
      .replace(MENTION_MARKUP, "@$1")
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/?(p|div|li|ul|ol|h[1-6]|blockquote|pre|tr|td|th|table)\b[^>]*>/gi, " ")
      .replace(/<[a-z/!][^>]*>?/gi, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}
