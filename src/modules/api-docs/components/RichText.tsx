import { Fragment, type ReactNode } from "react";
import { C } from "./prose";

/**
 * Renders the small markdown subset the API document uses in descriptions: paragraphs
 * separated by blank lines, `code`, **bold** and *italic*. Everything else is plain text; nothing is
 * injected as HTML.
 */
export function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <C key={i}>{part.slice(1, -1)}</C>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i} className="font-body-semibold text-heading">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

interface Props {
  text?: string;
  className?: string;
}

export default function RichText({ text, className = "text-sm text-body leading-relaxed" }: Props) {
  if (!text?.trim()) return null;
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i < paragraphs.length - 1 ? "mb-2" : undefined}>
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
