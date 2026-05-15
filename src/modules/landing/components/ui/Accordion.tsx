import { useState } from "react";
import clsx from "clsx";

interface Props {
  question: string;
  answer: string;
}

export default function Accordion({ question, answer }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border-input">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="text-heading font-body-semibold text-base pr-4 group-hover:text-primary transition-colors">
          {question}
        </span>
        <svg
          className={clsx(
            "w-5 h-5 text-muted shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 pb-5" : "max-h-0",
        )}
      >
        <p className="text-body leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}
