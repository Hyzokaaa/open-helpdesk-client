import { useState } from "react";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  /** How many lines are folded, shown before loading them. */
  lines: number;
  /** Loads the folded text; only called when the reader opens it. */
  load: () => Promise<string>;
}

/**
 * What an emailed reply carried besides its sender's words (the message it answered, the
 * signature), folded under the comment. Nothing of an email is thrown away; it is read here.
 */
export default function QuotedEmailText({ lines, load }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (text !== null) return;
    setLoading(true);
    setFailed(false);
    try {
      setText(await load());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} aria-expanded={open} className="text-exs text-muted hover:text-primary cursor-pointer">
        {open ? t("ticketDetail.hideQuoted") : t("ticketDetail.showQuoted").replace("{count}", String(lines))}
      </button>
      {open && (
        <div className="mt-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3 text-xs text-muted whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
          {loading ? "…" : failed ? t("ticketDetail.quotedError") : text}
        </div>
      )}
    </div>
  );
}
