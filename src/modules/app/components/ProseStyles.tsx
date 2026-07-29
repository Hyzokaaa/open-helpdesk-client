/**
 * Injects rich-content prose styles into <head> at runtime.
 * Bypasses @tailwindcss/vite which was swallowing our CSS rules.
 * Used by both the KB editor (.tiptap) and portal viewer (.kb-content).
 */
export default function ProseStyles() {
  return (
    <style>{`
      .tiptap p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: var(--th-subtle);
        pointer-events: none;
        height: 0;
      }

      .tiptap h1, .kb-content h1 {
        font-size: 1.875rem;
        line-height: 2.25rem;
        font-family: var(--font-body-bold);
        font-weight: 700;
        color: var(--th-heading);
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }

      .tiptap h2, .kb-content h2 {
        font-size: 1.5rem;
        line-height: 2rem;
        font-family: var(--font-body-bold);
        font-weight: 700;
        color: var(--th-heading);
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
      }

      .tiptap h3, .kb-content h3 {
        font-size: 1.25rem;
        line-height: 1.75rem;
        font-family: var(--font-body-semibold);
        font-weight: 600;
        color: var(--th-heading);
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
      }

      .tiptap h4, .kb-content h4 {
        font-size: 1.125rem;
        line-height: 1.75rem;
        font-family: var(--font-body-semibold);
        font-weight: 600;
        color: var(--th-heading);
        margin-top: 1rem;
        margin-bottom: 0.25rem;
      }

      .tiptap > h1:first-child, .kb-content > h1:first-child,
      .tiptap > h2:first-child, .kb-content > h2:first-child,
      .tiptap > h3:first-child, .kb-content > h3:first-child,
      .tiptap > h4:first-child, .kb-content > h4:first-child {
        margin-top: 0;
      }

      .tiptap p, .kb-content p {
        margin-top: 0;
        margin-bottom: 0.75rem;
        line-height: 1.625;
      }

      .tiptap strong, .kb-content strong,
      .tiptap b, .kb-content b {
        font-family: var(--font-body-bold);
        font-weight: 700;
      }

      .tiptap em, .kb-content em,
      .tiptap i, .kb-content i {
        font-style: italic;
      }

      .tiptap ul, .kb-content ul {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .tiptap ol, .kb-content ol {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.75rem;
      }

      .tiptap li, .kb-content li {
        margin-bottom: 0.25rem;
        line-height: 1.625;
      }

      .tiptap li > ul, .kb-content li > ul,
      .tiptap li > ol, .kb-content li > ol {
        margin-top: 0.25rem;
        margin-bottom: 0.25rem;
      }

      .tiptap blockquote, .kb-content blockquote {
        border-left: 3px solid var(--th-primary, #047857);
        padding-left: 1rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
        color: var(--th-muted);
        font-style: italic;
      }

      .tiptap blockquote p, .kb-content blockquote p {
        margin-bottom: 0.25rem;
      }

      .tiptap a, .kb-content a {
        color: var(--th-primary, #047857);
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .tiptap a:hover, .kb-content a:hover {
        color: var(--th-primary-light, #059669);
      }

      .tiptap hr, .kb-content hr {
        border: none;
        border-top: 1px solid var(--th-border-card);
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .tiptap code, .kb-content code {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        font-size: 0.875em;
        background-color: var(--th-surface-hover);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
      }

      .tiptap pre, .kb-content pre {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        font-size: 0.875em;
        background-color: var(--th-surface-hover);
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .tiptap pre code, .kb-content pre code {
        background: none;
        padding: 0;
        border-radius: 0;
      }

      .tiptap img, .kb-content img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .tiptap table, .kb-content table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .tiptap th, .kb-content th,
      .tiptap td, .kb-content td {
        border: 1px solid var(--th-border-input);
        padding: 0.5rem 0.75rem;
        text-align: left;
      }

      .tiptap th, .kb-content th {
        font-family: var(--font-body-semibold);
        font-weight: 600;
        background-color: var(--th-surface-hover);
      }
    `}</style>
  );
}
