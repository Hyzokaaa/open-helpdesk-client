import type { OpenApiDocument, RateLimit, RequestBodyObject, SchemaObject, WebhookDelivery } from "./openapi.types";
import { deref } from "./resolve-ref";
import { buildExample } from "./build-example";
import { schemaFields, type SchemaField } from "./schema-fields";

/** A webhook event as the document describes it, ready for the Webhooks guide. */
export interface DocumentedWebhook {
  event: string;
  summary?: string;
  description?: string;
  /** False for events that can be selected but are not sent (`x-not-delivered`). */
  delivered: boolean;
  /** Schema of the whole request body: { event, data, timestamp }. */
  schema?: SchemaObject;
  fields: SchemaField[];
  example: unknown;
}

/** The events of `x-webhooks`, in document order, with their body fields and an example body. */
export function documentWebhooks(document: OpenApiDocument): DocumentedWebhook[] {
  return Object.entries(document["x-webhooks"] ?? {}).flatMap(([event, item]) => {
    const post = item?.post;
    if (!post) return [];
    const body = deref<RequestBodyObject>(document, post.requestBody);
    const schema = body?.content?.["application/json"]?.schema;
    return [{
      event,
      summary: post.summary,
      description: post.description,
      delivered: post["x-not-delivered"] !== true,
      schema,
      fields: schemaFields(document, schema),
      example: schema ? buildExample(document, schema, "response") : undefined,
    }];
  });
}

/** `x-webhook-delivery`, or null when the document does not carry it. */
export function webhookDelivery(document: OpenApiDocument): WebhookDelivery | null {
  return document["x-webhook-delivery"] ?? null;
}

/** The signature header, from the delivery facts or, failing that, from the header list. */
export function signatureHeader(delivery: WebhookDelivery | null): string | null {
  if (!delivery) return null;
  return delivery.signature?.header ?? delivery.headers?.find((h) => /signature/i.test(h.name))?.name ?? null;
}

/** `x-rate-limit`, or null when the document does not carry a usable one. */
export function rateLimit(document: OpenApiDocument): RateLimit | null {
  const value = document["x-rate-limit"];
  return value && typeof value.limit === "number" && typeof value.windowSeconds === "number" ? value : null;
}

/** "10 s", "1.5 s", "250 ms". */
export function formatMilliseconds(ms: number): string {
  return ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`;
}
