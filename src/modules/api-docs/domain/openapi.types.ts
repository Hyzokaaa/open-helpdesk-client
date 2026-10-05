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

/** One entry of `x-webhooks`: the request the server sends for an event (Redoc convention). */
export interface WebhookOperationObject {
  summary?: string;
  description?: string;
  requestBody?: RequestBodyObject | RefObject;
  /** Set on events that can be selected on a webhook but are not sent. */
  "x-not-delivered"?: boolean;
}

export interface DocumentedHeader {
  name: string;
  value?: string;
  description?: string;
}

/** `x-webhook-delivery`: how the server delivers webhooks. */
export interface WebhookDelivery {
  method?: string;
  contentType?: string;
  body?: string;
  headers?: DocumentedHeader[];
  signature?: { header: string; algorithm: string; encoding?: string; signedContent?: string; key?: string };
  timeoutMs?: number;
  attempts?: number;
  retries?: number;
  successStatus?: string;
  failure?: string;
  redirects?: string;
  ordering?: string;
  subscription?: string;
}

/** `x-rate-limit`: the throttling of the public API. */
export interface RateLimit {
  limit: number;
  windowSeconds: number;
  scope?: string;
  description?: string;
  tracker?: string;
  trackerNote?: string;
  perEndpoint?: boolean;
  storage?: string;
  storageNote?: string;
  exceededStatus?: number;
  headers?: DocumentedHeader[];
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
  "x-webhooks"?: Record<string, { post?: WebhookOperationObject }>;
  "x-webhook-delivery"?: WebhookDelivery;
  "x-rate-limit"?: RateLimit;
}
