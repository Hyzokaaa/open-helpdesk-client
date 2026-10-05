import { useCallback, useEffect, useState } from "react";
import type { OpenApiDocument } from "../domain/openapi.types";
import { fetchOpenApiDocument } from "../services/openapi.service";

export interface OpenApiDocumentState {
  document: OpenApiDocument | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export default function useOpenApiDocument(): OpenApiDocumentState {
  const [document, setDocument] = useState<OpenApiDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchOpenApiDocument(controller.signal)
      .then(setDocument)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { document, loading, error, retry };
}
