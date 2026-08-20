import { useState } from "react";
import clsx from "clsx";

const SIZE_CLASSES = {
  sm: { square: "w-7 h-7", wide: "h-7 w-auto max-w-[112px]" },
  md: { square: "w-8 h-8", wide: "h-8 w-auto max-w-[128px]" },
  lg: { square: "w-10 h-10", wide: "h-10 w-auto max-w-[160px]" },
  xl: { square: "w-12 h-12", wide: "h-12 w-auto max-w-[192px]" },
} as const;

type Size = keyof typeof SIZE_CLASSES;

interface BrandLogoProps {
  src: string;
  size?: Size;
  className?: string;
}

export default function BrandLogo({ src, size = "md", className }: BrandLogoProps) {
  const [isWide, setIsWide] = useState(false);

  const classes = SIZE_CLASSES[size];

  return (
    <img
      src={src}
      alt=""
      className={clsx(
        "object-contain shrink-0",
        isWide ? classes.wide : classes.square,
        className,
      )}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setIsWide(img.naturalWidth / img.naturalHeight > 1.5);
        }
      }}
    />
  );
}
