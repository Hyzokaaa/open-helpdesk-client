/**
 * The rich text editor always returns HTML, but content created outside it — email
 * imported before the backend started converting it, or the API — may be plain text.
 * Opening such a ticket and saving turns `Prueba` into `<p>Prueba</p>`, which is not
 * an edit the user made.
 *
 * Wrapping bare text in a paragraph mirrors what the editor does on load, so both
 * sides compare equal. Anything that already contains markup is left untouched, so
 * real formatting changes are still detected.
 */
export function normalizeRichText(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  if (!text) return "";
  if (/<[a-z][^>]*>/i.test(text)) return text;
  return `<p>${text}</p>`;
}

export function isSameRichText(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeRichText(a) === normalizeRichText(b);
}

/** Readable one-line preview, for diffs and summaries. */
export function summarizeRichText(value: string | null | undefined, maxLength = 50): string {
  const text = (value ?? "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "—";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
