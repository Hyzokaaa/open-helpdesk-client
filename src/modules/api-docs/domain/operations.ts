import {
  HTTP_METHODS,
  type DocumentedScope,
  type HttpMethod,
  type OpenApiDocument,
  type OperationObject,
  type ParameterObject,
  type RequestBodyObject,
  type ResponseObject,
  type SchemaObject,
} from "./openapi.types";
import { deref } from "./resolve-ref";

export interface DocOperation {
  /** URL-safe id used in the docs route: "list-tickets". */
  slug: string;
  method: HttpMethod;
  path: string;
  operation: OperationObject;
  parameters: ParameterObject[];
}

export interface OperationGroup {
  tag: string;
  description?: string;
  operations: DocOperation[];
}

const UNTAGGED = "Other";

function kebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Stable route id for an operation: the operationId without its controller prefix
 * ("ApiController_listTickets" → "list-tickets"), or the method and path when there is none.
 */
export function operationSlug(method: string, path: string, operation: OperationObject): string {
  const id = operation.operationId?.split("_").pop();
  return id ? kebab(id) : kebab(`${method} ${path.replace(/[{}]/g, "")}`);
}

/** Path-level parameters overridden by operation-level ones with the same name and location. */
function mergeParameters(document: OpenApiDocument, pathLevel: unknown[] = [], opLevel: unknown[] = []): ParameterObject[] {
  const byKey = new Map<string, ParameterObject>();
  for (const raw of [...pathLevel, ...opLevel]) {
    const p = deref<ParameterObject>(document, raw as ParameterObject);
    if (p?.name) byKey.set(`${p.in}:${p.name}`, p);
  }
  const order = { path: 0, query: 1, header: 2, cookie: 3 } as const;
  return [...byKey.values()].sort((a, b) => order[a.in] - order[b.in]);
}

/**
 * Operations grouped by their first tag, in the order the document declares its tags; tags
 * the document does not declare follow in order of appearance.
 */
export function groupOperations(document: OpenApiDocument): OperationGroup[] {
  const groups = new Map<string, OperationGroup>();
  for (const tag of document.tags ?? []) groups.set(tag.name, { tag: tag.name, description: tag.description, operations: [] });

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation) continue;
      const tag = operation.tags?.[0] ?? UNTAGGED;
      if (!groups.has(tag)) groups.set(tag, { tag, operations: [] });
      groups.get(tag)!.operations.push({
        slug: operationSlug(method, path, operation),
        method,
        path,
        operation,
        parameters: mergeParameters(document, item.parameters, operation.parameters),
      });
    }
  }

  return [...groups.values()].filter((g) => g.operations.length > 0);
}

export function findOperation(groups: OperationGroup[], slug: string): DocOperation | undefined {
  for (const group of groups) {
    const found = group.operations.find((op) => op.slug === slug);
    if (found) return found;
  }
  return undefined;
}

const SCOPE_SENTENCE = /^Requires scope `([^`]+)`\.\s*/;

/** The API key scope an operation requires: the x-required-scope extension, else the scope sentence. */
export function requiredScope(operation: OperationObject): string | undefined {
  return operation["x-required-scope"] ?? SCOPE_SENTENCE.exec(operation.description ?? "")?.[1];
}

/** The description without the leading scope sentence, which the page shows as a badge instead. */
export function descriptionWithoutScope(operation: OperationObject): string {
  return (operation.description ?? "").replace(SCOPE_SENTENCE, "").trim();
}

/**
 * Every scope of the bearer scheme (x-scopes extension), falling back to the scopes the
 * operations require when the document does not list them.
 */
export function documentScopes(document: OpenApiDocument): DocumentedScope[] {
  for (const scheme of Object.values(document.components?.securitySchemes ?? {})) {
    if (scheme["x-scopes"]?.length) return scheme["x-scopes"];
  }
  const seen = new Set<string>();
  for (const group of groupOperations(document)) {
    for (const { operation } of group.operations) {
      const scope = requiredScope(operation);
      if (scope) seen.add(scope);
    }
  }
  return [...seen].map((scope) => ({ scope, description: "", default: true }));
}

/** Operations that require each scope, for the scopes table. */
export function operationsByScope(groups: OperationGroup[]): Map<string, DocOperation[]> {
  const map = new Map<string, DocOperation[]>();
  for (const group of groups) {
    for (const op of group.operations) {
      const scope = requiredScope(op.operation);
      if (!scope) continue;
      map.set(scope, [...(map.get(scope) ?? []), op]);
    }
  }
  return map;
}

export function requestBodySchema(document: OpenApiDocument, operation: OperationObject): SchemaObject | undefined {
  const body = deref<RequestBodyObject>(document, operation.requestBody);
  return body?.content?.["application/json"]?.schema;
}

export interface DocResponse {
  status: string;
  description?: string;
  schema?: SchemaObject;
}

export function operationResponses(document: OpenApiDocument, operation: OperationObject): DocResponse[] {
  return Object.entries(operation.responses ?? {})
    .map(([status, raw]) => {
      const response = deref<ResponseObject>(document, raw);
      return { status, description: response?.description, schema: response?.content?.["application/json"]?.schema };
    })
    .sort((a, b) => a.status.localeCompare(b.status));
}
