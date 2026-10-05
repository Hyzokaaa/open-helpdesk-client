import type { OpenApiDocument, RefObject, SchemaObject } from "./openapi.types";

const MAX_REF_HOPS = 16;

export function isRef(value: unknown): value is RefObject {
  return typeof value === "object" && value !== null && typeof (value as RefObject).$ref === "string";
}

/** "#/components/schemas/ApiTicketDetail" → "ApiTicketDetail". */
export function refName(ref: string): string {
  return ref.slice(ref.lastIndexOf("/") + 1);
}

/** Looks up a local JSON pointer ("#/components/..."). Remote references are not supported. */
export function lookupRef(document: OpenApiDocument, ref: string): unknown {
  if (!ref.startsWith("#/")) return undefined;
  let node: unknown = document;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/** Follows $ref chains to the referenced object. Unknown references resolve to undefined. */
export function deref<T>(document: OpenApiDocument, value: T | RefObject | undefined): T | undefined {
  let current: unknown = value;
  for (let hops = 0; isRef(current); hops++) {
    if (hops >= MAX_REF_HOPS) return undefined;
    current = lookupRef(document, current.$ref);
  }
  return current as T | undefined;
}

export interface ResolvedSchema {
  schema: SchemaObject;
  /** Name of the component the schema came from, when it was a $ref. */
  name?: string;
}

/**
 * Resolves a schema for display: follows $ref, keeps the keywords written next to the $ref
 * (description, nullable, example...) over the component's, and merges allOf members.
 *
 * Shared enum components drop their own description: @nestjs/swagger copies into them the
 * description of whichever property registered the enum first, which is wrong everywhere else.
 */
export function resolveSchema(document: OpenApiDocument, schema: SchemaObject | undefined): ResolvedSchema {
  if (!schema) return { schema: {} };

  let name: string | undefined;
  let resolved: SchemaObject = schema;

  if (schema.$ref) {
    name = refName(schema.$ref);
    const target = deref<SchemaObject>(document, schema) ?? {};
    const { $ref: _ignored, ...siblings } = schema;
    void _ignored;
    const base = target.enum ? { ...target, description: undefined } : target;
    resolved = { ...base, ...siblings };
  }

  if (resolved.allOf?.length) {
    const merged: SchemaObject = { ...resolved, allOf: undefined };
    for (const member of resolved.allOf) {
      const part = resolveSchema(document, member).schema;
      merged.type ??= part.type;
      merged.description ??= part.description;
      if (part.properties) merged.properties = { ...part.properties, ...merged.properties };
      if (part.required) merged.required = [...new Set([...(merged.required ?? []), ...part.required])];
      if (part.enum && !merged.enum) merged.enum = part.enum;
    }
    if (!name && resolved.allOf.length === 1 && resolved.allOf[0].$ref) name = refName(resolved.allOf[0].$ref);
    resolved = merged;
  }

  return { schema: resolved, name };
}
