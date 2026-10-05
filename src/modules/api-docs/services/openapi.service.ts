import { API_URL } from "@modules/app/domain/constants/env";
import type { OpenApiDocument } from "../domain/openapi.types";

/** Base URL of this instance's API, as the rest of the app calls it. */
export const API_BASE_URL = API_URL.replace(/\/+$/, "");

export const OPENAPI_DOCUMENT_URL = `${API_BASE_URL}/api/v1/openapi.json`;

/**
 * Fetches the public API's OpenAPI document. Plain fetch without credentials: the document is
 * public, and the app's axios instance would attach the user's session token.
 */
export async function fetchOpenApiDocument(signal?: AbortSignal): Promise<OpenApiDocument> {
  const response = await fetch(OPENAPI_DOCUMENT_URL, { signal, credentials: "omit", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const document = (await response.json()) as OpenApiDocument;
  if (!document || typeof document.paths !== "object") throw new Error("Not an OpenAPI document");
  return document;
}
