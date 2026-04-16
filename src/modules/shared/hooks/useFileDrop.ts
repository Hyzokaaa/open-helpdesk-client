import { useEffect, useState, useCallback } from "react";

interface UseFileDropOptions {
  onFiles: (files: File[]) => void;
  accept?: string[];
}

export default function useFileDrop({ onFiles, accept }: UseFileDropOptions) {
  const [dragging, setDragging] = useState(false);

  const filterFiles = useCallback(
    (files: File[]): File[] => {
      if (!accept) return files;
      return files.filter((f) =>
        accept.some((type) => {
          if (type.endsWith("/*")) {
            return f.type.startsWith(type.replace("/*", "/"));
          }
          return f.type === type;
        }),
      );
    },
    [accept],
  );

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        setDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setDragging(false);

      if (e.dataTransfer?.files) {
        const files = filterFiles(Array.from(e.dataTransfer.files));
        if (files.length > 0) onFiles(files);
      }
    };

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

      const filtered = filterFiles(files);
      if (filtered.length > 0) onFiles(filtered);
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("paste", handlePaste);
    };
  }, [onFiles, filterFiles]);

  return { dragging };
}
