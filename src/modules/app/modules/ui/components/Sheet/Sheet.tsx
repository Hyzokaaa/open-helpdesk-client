import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  onClose: () => void;
}

export default function Sheet({ children, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto mx-4 my-4"
      >
        <button
          onClick={onClose}
          className="sticky top-3 float-right mr-3 mt-1 text-gray-400 hover:text-gray-600 text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer z-20"
        >
          ✕
        </button>

        <div className="p-6 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
