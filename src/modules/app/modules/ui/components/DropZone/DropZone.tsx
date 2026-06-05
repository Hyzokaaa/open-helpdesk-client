import { useCallback, useEffect, useRef, useState } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string[];
  dropHint?: string;
  children?: React.ReactNode;
}

function filterFiles(files: File[], accept?: string[]): File[] {
  if (!accept) return files;
  return files.filter((f) =>
    accept.some((type) => {
      if (type.endsWith("/*")) {
        return f.type.startsWith(type.replace("/*", "/"));
      }
      return f.type === type;
    }),
  );
}

export default function DropZone({ onFiles, accept, dropHint, children }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragging(false);

      if (e.dataTransfer?.files) {
        const files = filterFiles(Array.from(e.dataTransfer.files), accept);
        if (files.length > 0) onFiles(files);
      }
    },
    [onFiles, accept],
  );

  // Paste handler stays on document level
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split("/")[1] || "png";
            files.push(
              new File([file], `clipboard-${Date.now()}.${ext}`, {
                type: file.type,
              }),
            );
          }
        }
      }

      const filtered = filterFiles(files, accept);
      if (filtered.length > 0) onFiles(filtered);
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [onFiles, accept]);

  // Prevent browser default drop behavior on document
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, []);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
        dragging
          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/10"
          : "border-gray-300 dark:border-gray-700"
      }`}
    >
      {children}
      {dragging && dropHint && (
        <p className="text-xs text-primary-500 font-body-medium text-center mt-2">
          {dropHint}
        </p>
      )}
    </div>
  );
}
