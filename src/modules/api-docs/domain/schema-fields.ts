import type { OpenApiDocument, ParameterObject, SchemaObject } from "./openapi.types";
import { refName, resolveSchema } from "./resolve-ref";

/** Short type label: "string", "string (date-time)", "array of ApiComment", "string | array of string". */
export function typeLabel(document: OpenApiDocument, schema: SchemaObject | undefined): string {
  if (!schema) return "any";
  const { schema: s, name } = resolveSchema(document, schema);

  const variants = s.oneOf ?? s.anyOf;
  if (variants?.length) return variants.map((v) => typeLabel(document, v)).join(" | ");

  if (s.type === "array" || s.items) return `array of ${typeLabel(document, s.items)}`;
  if (s.enum) return s.type ?? "string";
  if (s.type === "object" || s.properties || s.additionalProperties) {
    if (name) return name;
    if (!s.properties && s.additionalProperties) {
      return typeof s.additionalProperties === "object"
        ? `map of ${typeLabel(document, s.additionalProperties)}`
        : "object";
    }
    return "object";
  }
  if (!s.type) return "string";
  return s.format ? `${s.type} (${s.format})` : s.type;
}

export interface SchemaField {
  /** Dotted path from the root, unique within the table ("items[].tagIds"). */
  path: string;
  name: string;
  depth: number;
  type: string;
  required: boolean;
  nullable: boolean;
  description?: string;
  enumValues?: string[];
  example?: unknown;
  defaultValue?: unknown;
  constraints: string[];
}

const MAX_DEPTH = 4;

function constraintsOf(s: SchemaObject): string[] {
  const out: string[] = [];
  if (s.minLength !== undefined) out.push(`min length ${s.minLength}`);
  if (s.maxLength !== undefined) out.push(`max length ${s.maxLength}`);
  if (s.minimum !== undefined) out.push(`min ${s.minimum}`);
  if (s.maximum !== undefined) out.push(`max ${s.maximum}`);
  return out;
}

/** The object schema whose properties become child rows: the schema itself or its array items. */
function childObject(document: OpenApiDocument, s: SchemaObject): { schema: SchemaObject; suffix: string } | null {
  if (s.properties) return { schema: s, suffix: "" };
  if (s.items) {
    const item = resolveSchema(document, s.items).schema;
    if (item.properties) return { schema: item, suffix: "[]" };
  }
  if (typeof s.additionalProperties === "object") {
    const value = resolveSchema(document, s.additionalProperties).schema;
    if (value.properties) return { schema: value, suffix: "{}" };
  }
  return null;
}

/**
 * Flattens an object schema into table rows, one per property, nesting the properties of
 * child objects (and of array items) below their parent with a greater depth. Component
 * cycles stop at the first repetition.
 */
export function schemaFields(document: OpenApiDocument, schema: SchemaObject | undefined): SchemaField[] {
  if (!schema) return [];
  const root = resolveSchema(document, schema);
  const start = childObject(document, root.schema);
  if (!start) return [];

  const rows: SchemaField[] = [];
  const walk = (object: SchemaObject, prefix: string, depth: number, seen: Set<string>) => {
    const required = new Set(object.required ?? []);
    for (const [name, property] of Object.entries(object.properties ?? {})) {
      const { schema: s, name: component } = resolveSchema(document, property);
      const path = prefix ? `${prefix}.${name}` : name;
      rows.push({
        path,
        name,
        depth,
        type: typeLabel(document, property),
        required: required.has(name),
        nullable: s.nullable === true,
        description: s.description,
        enumValues: (s.enum ?? (s.items ? resolveSchema(document, s.items).schema.enum : undefined))?.map(String),
        example: s.example,
        defaultValue: s.default,
        constraints: constraintsOf(s),
      });

      const child = childObject(document, s);
      const key = component ?? (s.items?.$ref ? refName(s.items.$ref) : undefined);
      if (child && depth + 1 < MAX_DEPTH && !(key && seen.has(key))) {
        const next = new Set(seen);
        if (key) next.add(key);
        walk(child.schema, `${path}${child.suffix}`, depth + 1, next);
      }
    }
  };

  walk(start.schema, start.suffix, 0, new Set(root.name ? [root.name] : []));
  return rows;
}

/** Parameters as table rows, with the parameter's own description and example first. */
export function parameterFields(document: OpenApiDocument, parameters: ParameterObject[]): SchemaField[] {
  return parameters.map((p) => {
    const s = resolveSchema(document, p.schema).schema;
    const items = s.items ? resolveSchema(document, s.items).schema : undefined;
    return {
      path: `${p.in}:${p.name}`,
      name: p.name,
      depth: 0,
      type: typeLabel(document, p.schema),
      required: p.required === true,
      nullable: false,
      description: p.description ?? s.description,
      enumValues: (s.enum ?? items?.enum)?.map(String),
      example: p.example ?? s.example,
      defaultValue: s.default,
      constraints: constraintsOf(s),
    };
  });
}
