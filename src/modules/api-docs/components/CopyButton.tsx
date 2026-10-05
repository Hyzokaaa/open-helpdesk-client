import { useEffect, useState } from "react";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={clsx(
        "px-2 py-0.5 rounded text-exs font-body-medium border transition-colors cursor-pointer",
        copied
          ? "border-primary/40 text-primary bg-primary/10"
          : "border-white/15 text-slate-300 hover:text-white hover:border-white/30",
        className,
      )}
    >
      {copied ? t("apiDocs.copied") : t("apiDocs.copy")}
    </button>
  );
}
