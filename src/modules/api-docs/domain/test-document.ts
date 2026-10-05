import type { OpenApiDocument } from "./openapi.types";

/** A trimmed copy of the shapes the backend's document uses, for the helper tests. */
export const TEST_DOCUMENT: OpenApiDocument = {
  openapi: "3.0.0",
  info: { title: "Open Helpdesk API", version: "1.0.0" },
  tags: [
    { name: "Tickets", description: "Tickets of the key's workspace." },
    { name: "Members", description: "Members." },
  ],
  paths: {
    "/api/v1/members": {
      get: {
        operationId: "ApiController_listMembers",
        tags: ["Members"],
        summary: "List members",
        description: "Requires scope `members:read`.",
        "x-required-scope": "members:read",
        responses: {
          "200": { description: "", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ApiMember" } } } } },
        },
      },
    },
    "/api/v1/tickets/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "01JTICKET" } }],
      patch: {
        operationId: "ApiController_updateTicket",
        tags: ["Tickets"],
        summary: "Update a ticket",
        description: "Requires scope `tickets:write`.\n\nChanges fields.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateTicket" } } } },
        responses: {
          "404": { $ref: "#/components/responses/NotFound" },
          "200": { description: "", content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } } },
        },
      },
    },
    "/api/v1/tickets": {
      get: {
        operationId: "ApiController_listTickets",
        tags: ["Tickets"],
        summary: "List tickets",
        description: "Requires scope `tickets:read`.",
        parameters: [
          { name: "status", in: "query", required: false, schema: { $ref: "#/components/schemas/TicketStatus" } },
          { name: "limit", in: "query", required: false, schema: { type: "number", example: 20 } },
        ],
        responses: {},
      },
      post: {
        operationId: "ApiController_createTicket",
        tags: ["Tickets"],
        summary: "Create a ticket",
        description: "Requires scope `tickets:write`.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateTicket" } } } },
        responses: {},
      },
    },
    "/api/v1/ping": { get: { summary: "Ping", responses: {} } },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "http",
        scheme: "bearer",
        "x-scopes": [
          { scope: "tickets:read", description: "Read tickets.", default: true },
          { scope: "auth:exchange:admin", description: "Admins.", default: false },
        ],
      },
    },
    responses: {
      NotFound: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
    schemas: {
      TicketStatus: { type: "string", description: "Leaked from another property.", enum: ["open", "in-progress", "resolved"] },
      Error: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }], example: "Ticket not found" },
        },
        required: ["statusCode", "message"],
      },
      Node: {
        type: "object",
        properties: { name: { type: "string" }, children: { type: "array", items: { $ref: "#/components/schemas/Node" } } },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string", example: "01JTICKET" },
          status: { $ref: "#/components/schemas/TicketStatus" },
          assigneeId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          tagIds: { type: "array", items: { type: "string" } },
          customFields: { type: "object", additionalProperties: true },
          comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
          tree: { $ref: "#/components/schemas/Node" },
        },
        required: ["id", "status"],
      },
      Comment: {
        type: "object",
        properties: { id: { type: "string" }, isInternal: { type: "boolean" } },
        required: ["id"],
      },
      CreateTicket: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 3, example: "Cannot log in" },
          description: { type: "string", example: "<p>Help</p>" },
          priority: { $ref: "#/components/schemas/TicketStatus", example: "open" },
          notes: { type: "string" },
          tagIds: { type: "array", items: { type: "string" }, default: [] },
          customFields: { type: "object", additionalProperties: true, example: { field: "x" } },
        },
        required: ["name", "priority"],
      },
      UpdateTicket: {
        allOf: [{ $ref: "#/components/schemas/Comment" }, { type: "object", properties: { name: { type: "string", example: "New" } } }],
      },
      ApiMember: {
        type: "object",
        properties: { userId: { type: "string", example: "01JUSER" }, role: { type: "string", enum: ["admin", "agent"] } },
        required: ["userId", "role"],
      },
    },
  },
};
