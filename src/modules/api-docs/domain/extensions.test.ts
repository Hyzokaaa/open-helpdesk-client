import { describe, expect, it } from "vitest";
import type { OpenApiDocument } from "./openapi.types";
import { documentWebhooks, formatMilliseconds, rateLimit, signatureHeader, webhookDelivery } from "./extensions";
import { deliveryFacts, rateLimitSentences, verificationExample } from "./guide-facts";

/** The shapes of the backend's x-webhooks, x-webhook-delivery and x-rate-limit, trimmed. */
const DOC: OpenApiDocument = {
  openapi: "3.0.0",
  info: { title: "Open Helpdesk API", version: "1.0.0" },
  paths: {},
  components: {
    schemas: {
      TicketStatus: { type: "string", enum: ["open", "pending"] },
      StatusData: {
        type: "object",
        required: ["ticketId", "newStatus"],
        properties: {
          ticketId: { type: "string", example: "01JTICKET" },
          newStatus: { $ref: "#/components/schemas/TicketStatus" },
          previousAssigneeId: { type: "string", nullable: true },
        },
      },
      StatusPayload: {
        type: "object",
        required: ["event", "data", "timestamp"],
        properties: {
          event: { type: "string", enum: ["ticket.statusChanged"] },
          data: { $ref: "#/components/schemas/StatusData" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
  "x-webhooks": {
    "ticket.statusChanged": {
      post: {
        summary: "Ticket status changed",
        description: "A ticket moved to another status.",
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/StatusPayload" } } } },
      },
    },
    "ticket.archived": {
      post: { summary: "Ticket archived", description: "Not sent yet.", "x-not-delivered": true },
    },
  },
  "x-webhook-delivery": {
    method: "POST",
    headers: [
      { name: "Content-Type", value: "application/json" },
      { name: "X-Webhook-Event" },
      { name: "X-Webhook-Signature", description: "HMAC" },
    ],
    signature: { header: "X-Webhook-Signature", algorithm: "HMAC-SHA256", encoding: "hex" },
    timeoutMs: 10000,
    attempts: 1,
    retries: 0,
    successStatus: "2xx",
    redirects: "followed",
  },
  "x-rate-limit": { limit: 100, windowSeconds: 60, scope: "ip-per-endpoint", tracker: "ip", perEndpoint: true, storage: "memory", exceededStatus: 429 },
};

const EMPTY: OpenApiDocument = { openapi: "3.0.0", info: { title: "x", version: "1" }, paths: {} };

describe("x-webhooks", () => {
  it("lists the events in document order with their delivery flag", () => {
    const events = documentWebhooks(DOC);
    expect(events.map((e) => [e.event, e.delivered])).toEqual([
      ["ticket.statusChanged", true],
      ["ticket.archived", false],
    ]);
  });

  it("flattens the body schema into field rows, nesting data below the envelope", () => {
    const [status] = documentWebhooks(DOC);
    expect(status.fields.map((f) => [f.path, f.depth, f.required])).toEqual([
      ["event", 0, true],
      ["data", 0, true],
      ["data.ticketId", 1, true],
      ["data.newStatus", 1, true],
      ["data.previousAssigneeId", 1, false],
      ["timestamp", 0, true],
    ]);
    expect(status.fields.find((f) => f.path === "data.newStatus")?.enumValues).toEqual(["open", "pending"]);
  });

  it("builds an example body from the schema", () => {
    const [status] = documentWebhooks(DOC);
    expect(status.example).toEqual({
      event: "ticket.statusChanged",
      data: { ticketId: "01JTICKET", newStatus: "open", previousAssigneeId: "string" },
      timestamp: "2026-01-15T10:30:00.000Z",
    });
  });

  it("gives an event without a body no fields and no example", () => {
    const archived = documentWebhooks(DOC)[1];
    expect(archived.fields).toEqual([]);
    expect(archived.example).toBeUndefined();
  });

  it("is empty when the document carries no webhooks", () => {
    expect(documentWebhooks(EMPTY)).toEqual([]);
    expect(webhookDelivery(EMPTY)).toBeNull();
    expect(signatureHeader(null)).toBeNull();
  });
});

describe("x-webhook-delivery", () => {
  it("names the signature header, from the signature or the header list", () => {
    expect(signatureHeader(webhookDelivery(DOC))).toBe("X-Webhook-Signature");
    expect(signatureHeader({ headers: [{ name: "X-Hook-Signature-256" }] })).toBe("X-Hook-Signature-256");
  });

  it("states attempts, timeout, retries and success status in both languages", () => {
    const delivery = webhookDelivery(DOC)!;
    const en = deliveryFacts(delivery, "en");
    expect(en[0]).toBe("Each delivery is a `POST` attempted once, with a 10 s timeout and no retries.");
    expect(en[1]).toContain("Any `2xx` response counts as delivered");
    expect(en).toContain("Redirects are followed.");
    const es = deliveryFacts(delivery, "es");
    expect(es[0]).toBe("Cada entrega es un `POST` que se intenta una sola vez, con un tiempo límite de 10 s y sin reintentos.");
    expect(deliveryFacts({ ...delivery, attempts: 3, retries: 2, timeoutMs: 500 }, "en")[0]).toBe(
      "Each delivery is a `POST` attempted 3 times, with a 500 ms timeout, with 2 retries.",
    );
  });

  it("puts the document's header name in the verification example", () => {
    const code = verificationExample("X-Other-Signature");
    expect(code).toContain("req.get('X-Other-Signature')");
    expect(code).not.toContain("X-Webhook-Signature");
  });

  it("formats milliseconds", () => {
    expect(formatMilliseconds(10000)).toBe("10 s");
    expect(formatMilliseconds(1500)).toBe("1.5 s");
    expect(formatMilliseconds(250)).toBe("250 ms");
  });
});

describe("x-rate-limit", () => {
  it("reads the limit, or null when missing or malformed", () => {
    expect(rateLimit(DOC)).toMatchObject({ limit: 100, windowSeconds: 60 });
    expect(rateLimit(EMPTY)).toBeNull();
    expect(rateLimit({ ...EMPTY, "x-rate-limit": { limit: "100" } as never })).toBeNull();
  });

  it("states the document's numbers and scope", () => {
    const en = rateLimitSentences(rateLimit(DOC)!, "en");
    expect(en.lead).toBe("Each endpoint allows **100 requests per 60 seconds per client IP address**.");
    expect(en.details).toHaveLength(2);
    expect(en.proxyNote).not.toBeNull();
    expect(rateLimitSentences({ limit: 5, windowSeconds: 3600 }, "es")).toEqual({
      lead: "Cada endpoint admite **5 peticiones cada 3600 segundos**.",
      details: [],
      proxyNote: null,
    });
  });
});
