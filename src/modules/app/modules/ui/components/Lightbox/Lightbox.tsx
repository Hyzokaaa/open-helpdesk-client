import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  src: string;
  type: "image" | "video";
  onClose: () => void;
}

export default function Lightbox({ src, type, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, moved: false });
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [onClose]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (type !== "image" || !mediaRef.current) return;

      const rect = mediaRef.current.getBoundingClientRect();
      const imgCenterX = rect.left + rect.width / 2;
      const imgCenterY = rect.top + rect.height / 2;

      // Mouse position relative to the image center
      const mouseX = e.clientX - imgCenterX;
      const mouseY = e.clientY - imgCenterY;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;

      setScale((prev) => {
        const next = Math.max(0.5, Math.min(8, prev * delta));
        const ratio = 1 - next / prev;

        setOffset((o) => ({
          x: o.x + mouseX * ratio,
          y: o.y + mouseY * ratio,
        }));

        return next;
      });
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, [type]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (type !== "image") return;
      e.preventDefault();
      setDragging(true);
      dragRef.current = {
        startX: e.clientX - offset.x,
        startY: e.clientY - offset.y,
        moved: false,
      };
    },
    [offset, type],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      dragRef.current.moved = true;
      setOffset({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      });
    };

    const handleMouseUp = () => setDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (mediaRef.current?.contains(e.target as Node)) return;
      onClose();
    },
    [onClose],
  );

  const handleMediaClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dragRef.current.moved) onClose();
    },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
      onClick={handleBackdropClick}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
      >
        ✕
      </button>

      {type === "image" ? (
        <img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt=""
          draggable={false}
          onMouseDown={handleMouseDown}
          onClick={handleMediaClick}
          className="max-w-none select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.1s ease-out",
            maxHeight: "90vh",
            maxWidth: "90vw",
            objectFit: "contain",
            cursor: dragging ? "grabbing" : "grab",
          }}
        />
      ) : (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          controls
          autoPlay
          className="max-h-[90vh] max-w-[90vw] cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
