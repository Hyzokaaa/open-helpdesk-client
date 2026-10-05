import type { OpenApiDocument, SchemaObject } from "./openapi.types";
import { resolveSchema } from "./resolve-ref";

export type ExampleMode = "request" | "response";

const FORMAT_EXAMPLES: Record<string, string> = {
  "date-time": "2026-01-15T10:30:00.000Z",
  date: "2026-01-15",
  email: "user@example.com",
  uri: "https://example.com",
  url: "https://example.com",
  uuid: "00000000-0000-0000-0000-000000000000",
};

/** Optional request fields worth prefilling: scalars with an explicit example. */
function isPrefilledOptional(document: OpenApiDocument, schema: SchemaObject): boolean {
  const s = resolveSchema(document, schema).schema;
  const isObject = s.type === "object" || !!s.properties || !!s.additionalProperties;
  return s.example !== undefined && !isObject;
}

/**
 * Builds an example value from a schema: the schema's own example or default first, then the
 * first enum value, then a placeholder by type. In "request" mode an object only gets its
 * required properties and the optional scalars with an explicit example, so the result is a body the API
 * would accept rather than every optional field; "response" mode includes every property.
 */
export function buildExample(
  document: OpenApiDocument,
  schema: SchemaObject | undefined,
  mode: ExampleMode = "response",
  seen: ReadonlySet<string> = new Set(),
): unknown {
  if (!schema) return undefined;
  const { schema: s, name } = resolveSchema(document, schema);

  if (s.example !== undefined) return s.example;
  if (s.default !== undefined && !(Array.isArray(s.default) && s.default.length === 0 && s.items)) return s.default;
  if (s.enum?.length) return s.enum[0];

  if (name && seen.has(name)) return s.type === "array" ? [] : {};
  const next = name ? new Set([...seen, name]) : seen;

  const variants = s.oneOf ?? s.anyOf;
  if (variants?.length) return buildExample(document, variants[0], mode, next);

  if (s.type === "array" || s.items) {
    const item = buildExample(document, s.items, mode, next);
    return item === undefined ? [] : [item];
  }

  if (s.type === "object" || s.properties || s.additionalProperties) {
    const required = new Set(s.required ?? []);
    const result: Record<string, unknown> = {};
    for (const [key, property] of Object.entries(s.properties ?? {})) {
      if (mode === "request" && !required.has(key) && !isPrefilledOptional(document, property)) continue;
      const value = buildExample(document, property, mode, next);
      if (value !== undefined) result[key] = value;
    }
    return result;
  }

  switch (s.type) {
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return true;
    default:
      return (s.format && FORMAT_EXAMPLES[s.format]) || "string";
  }
}
