import type { OpenApiDocument } from "../domain/openapi.types";
import type { OperationGroup } from "../domain/operations";

export type DocsLang = "en" | "es";

export interface GuideProps {
  lang: DocsLang;
  /** Null while the document loads or when it failed; guides must render without it. */
  document: OpenApiDocument | null;
  groups: OperationGroup[];
  /** Base URL of this instance's API, without a trailing slash. */
  baseUrl: string;
}
