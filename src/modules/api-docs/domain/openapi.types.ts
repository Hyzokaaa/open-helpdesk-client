/**
 * The subset of OpenAPI 3.0 the docs page reads. The backend generates the document with
 * @nestjs/swagger; anything it does not emit is left out on purpose.
 */

export interface RefObject {
  $ref: string;
}

export interface SchemaObject {
  $ref?: string;
  type?: string;
  format?: string;
  description?: string;
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  nullable?: boolean;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  additionalProperties?: boolean | SchemaObject;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface ParameterObject {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  example?: unknown;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: unknown;
}

export interface RequestBodyObject {
  required?: boolean;
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaTypeObject>;
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: (ParameterObject | RefObject)[];
  requestBody?: RequestBodyObject | RefObject;
  responses?: Record<string, ResponseObject | RefObject>;
  security?: Record<string, string[]>[];
  deprecated?: boolean;
  "x-required-scope"?: string;
}

export const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export type PathItemObject = Partial<Record<HttpMethod, OperationObject>> & {
  parameters?: (ParameterObject | RefObject)[];
};

export interface DocumentedScope {
  scope: string;
  description: string;
  default: boolean;
}

export interface SecuritySchemeObject {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  description?: string;
  "x-scopes"?: DocumentedScope[];
}

export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, PathItemObject>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    parameters?: Record<string, ParameterObject>;
    requestBodies?: Record<string, RequestBodyObject>;
    responses?: Record<string, ResponseObject>;
    securitySchemes?: Record<string, SecuritySchemeObject>;
  };
}
