import { useCallback, useRef, useState } from "react";

export interface StagedFile {
  key: number;
  file: File;
  status: "uploading" | "done" | "error";
  token?: string;
}

/** Uploads a file before the message it belongs to exists, and returns the token that claims it. */
export type StageFile = (file: File) => Promise<{ token: string }>;

/**
 * Files uploaded while a message is being written. Each one uploads as soon as it is added,
 * so sending the message only hands over the tokens of the files that are ready.
 */
export default function useStagedUploads(stage: StageFile) {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const nextKey = useRef(0);

  const upload = useCallback(async (key: number, file: File) => {
    setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "uploading" } : f)));
    try {
      const { token } = await stage(file);
      setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "done", token } : f)));
    } catch {
      setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, status: "error" } : f)));
    }
  }, [stage]);

  const add = useCallback((newFiles: File[]) => {
    const entries = newFiles.map((file) => ({ key: nextKey.current++, file, status: "uploading" as const }));
    setFiles((prev) => [...prev, ...entries]);
    entries.forEach((entry) => upload(entry.key, entry.file));
  }, [upload]);

  const retry = useCallback((key: number) => {
    const entry = files.find((f) => f.key === key);
    if (entry) upload(entry.key, entry.file);
  }, [files, upload]);

  const remove = useCallback((key: number) => {
    setFiles((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const clear = useCallback(() => setFiles([]), []);

  const tokens = files.filter((f) => f.status === "done" && f.token).map((f) => f.token as string);
  const uploading = files.some((f) => f.status === "uploading");

  return { files, add, retry, remove, clear, tokens, uploading };
}
