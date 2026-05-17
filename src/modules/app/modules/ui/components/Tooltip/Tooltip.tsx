import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
  children?: React.ReactNode;
}

export default function Tooltip({ text, children }: Props) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<"bottom" | "top">("bottom");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(rect.bottom + 80 > window.innerHeight ? "top" : "bottom");
    }
  }, [visible]);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children ?? (
        <span className="w-4 h-4 rounded-full border border-subtle text-subtle text-[10px] flex items-center justify-center cursor-help select-none">
          ?
        </span>
      )}
      {visible && (
        <span
          className={`absolute z-50 left-1/2 -translate-x-1/2 px-3 py-2 rounded text-xs text-on-primary bg-gray-800 dark:bg-gray-700 shadow-lg w-max text-center leading-relaxed pointer-events-none ${
            position === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
