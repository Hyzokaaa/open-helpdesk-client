import DOMPurify from "dompurify";

/**
 * Client-side defense in depth for HTML the backend stores (ticket
 * descriptions, comments, knowledge-base articles, edit history).
 *
 * The backend already sanitizes on write with an allowlist; this mirrors that
 * allowlist so a bypass there, an older row written before the server-side
 * sanitizer existed, or a compromised API response cannot run script in the
 * browser. Tokens live in localStorage, so any XSS here is account takeover.
 *
 * Keep this list in sync with the backend's
 * `src/shared/domain/sanitize-html.ts` (base list plus the knowledge-base
 * extras `h2`, `h3`, `img[src|alt]`).
 */
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del",
  "code", "pre", "blockquote",
  "ul", "ol", "li",
  "a", "span",
  // Knowledge-base articles only, harmless elsewhere
  "h2", "h3", "img",
];

const ALLOWED_ATTR = [
  // a
  "href", "target", "rel",
  // span (tiptap mentions)
  "class", "data-type", "data-id", "data-label",
  // img (knowledge base)
  "src", "alt",
];

const SAFE_TARGETS = new Set(["_blank", "_self"]);

const purifier = DOMPurify();

purifier.setConfig({
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Only the data-* attributes listed above, not any data-* attribute
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
  // Drop <style>, <script>, <template> content along with the tags
  KEEP_CONTENT: true,
  FORBID_TAGS: ["style", "script", "template", "iframe", "object", "embed", "form", "input", "svg", "math"],
  // DOMPurify's default ALLOWED_URI_REGEXP already rejects javascript: and
  // data: on href while allowing http(s), mailto, tel and relative URLs.
});

// Any link that opens a new tab must not hand the opener to the target page.
purifier.addHook("afterSanitizeAttributes", (node) => {
  if (!(node instanceof HTMLElement) || node.tagName !== "A") return;
  const target = node.getAttribute("target");
  if (target === null) return;
  if (!SAFE_TARGETS.has(target)) {
    node.removeAttribute("target");
    return;
  }
  if (target === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Returns `html` with everything outside the backend's allowlist removed.
 * Always run server-provided HTML through this before `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return purifier.sanitize(html);
}

export default sanitizeHtml;
