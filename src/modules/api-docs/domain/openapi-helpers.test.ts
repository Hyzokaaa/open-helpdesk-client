import { describe, expect, it } from "vitest";
import { TEST_DOCUMENT as doc } from "./test-document";
import { deref, lookupRef, refName, resolveSchema } from "./resolve-ref";
import { parameterFields, schemaFields, typeLabel } from "./schema-fields";
import { buildExample } from "./build-example";
import {
  descriptionWithoutScope,
  documentScopes,
  findOperation,
  groupOperations,
  operationResponses,
  operationSlug,
  operationsByScope,
  requestBodySchema,
  requiredScope,
} from "./operations";
import type { SchemaObject } from "./openapi.types";

const schema = (name: string): SchemaObject => ({ $ref: `#/components/schemas/${name}` });

describe("resolve-ref", () => {
  it("looks up local pointers and names them", () => {
    expect(refName("#/components/schemas/Ticket")).toBe("Ticket");
    expect(lookupRef(doc, "#/components/schemas/Comment")).toBe(doc.components!.schemas!.Comment);
    expect(lookupRef(doc, "#/components/schemas/Missing")).toBeUndefined();
    expect(lookupRef(doc, "https://example.com/schema.json")).toBeUndefined();
  });

  it("follows references and returns plain objects as they are", () => {
    expect(deref(doc, { $ref: "#/components/responses/NotFound" })).toMatchObject({ description: "Not found" });
    const plain = { description: "x" };
    expect(deref(doc, plain)).toBe(plain);
  });

  it("keeps keywords written next to a $ref over the component's", () => {
    const { schema: s, name } = resolveSchema(doc, { $ref: "#/components/schemas/Comment", nullable: true, description: "Here" });
    expect(name).toBe("Comment");
    expect(s).toMatchObject({ type: "object", nullable: true, description: "Here" });
    expect(s.$ref).toBeUndefined();
  });

  it("drops the description a shared enum component carries", () => {
    expect(resolveSchema(doc, schema("TicketStatus")).schema.description).toBeUndefined();
  });

  it("merges allOf members", () => {
    const s = resolveSchema(doc, schema("UpdateTicket")).schema;
    expect(Object.keys(s.properties!)).toEqual(["name", "id", "isInternal"]);
    expect(s.required).toEqual(["id"]);
  });
});

describe("schema-fields", () => {
  it("labels types", () => {
    expect(typeLabel(doc, { type: "string", format: "date-time" })).toBe("string (date-time)");
    expect(typeLabel(doc, { type: "array", items: schema("Comment") })).toBe("array of Comment");
    expect(typeLabel(doc, schema("TicketStatus"))).toBe("string");
    expect(typeLabel(doc, { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] })).toBe("string | array of string");
    expect(typeLabel(doc, {})).toBe("string");
    expect(typeLabel(doc, { type: "object", additionalProperties: true })).toBe("object");
  });

  it("flattens nested objects and array items, with enums, nullability and requiredness", () => {
    const rows = schemaFields(doc, schema("Ticket"));
    const byPath = Object.fromEntries(rows.map((r) => [r.path, r]));
    expect(byPath.id).toMatchObject({ required: true, depth: 0, example: "01JTICKET" });
    expect(byPath.status).toMatchObject({ enumValues: ["open", "in-progress", "resolved"], required: true });
    expect(byPath.assigneeId).toMatchObject({ nullable: true, required: false });
    expect(byPath["comments[].id"]).toMatchObject({ depth: 1, required: true, type: "string" });
    expect(byPath["comments[].isInternal"]).toMatchObject({ depth: 1, type: "boolean" });
  });

  it("stops at recursive components", () => {
    const paths = schemaFields(doc, schema("Ticket")).map((r) => r.path);
    expect(paths).toContain("tree.children");
    expect(paths).not.toContain("tree.children[].name");
  });

  it("lists the items of an array root and reports constraints", () => {
    expect(schemaFields(doc, { type: "array", items: schema("ApiMember") }).map((r) => r.path)).toEqual(["[].userId", "[].role"]);
    expect(schemaFields(doc, schema("CreateTicket"))[0].constraints).toEqual(["min length 3"]);
    expect(schemaFields(doc, { type: "string" })).toEqual([]);
  });
});

describe("parameterFields", () => {
  it("describes parameters with their enum values and examples", () => {
    const rows = parameterFields(doc, [
      { name: "status", in: "query", description: "Filter.", schema: { $ref: "#/components/schemas/TicketStatus" } },
      { name: "id", in: "path", required: true, schema: { type: "string", example: "01JT" } },
      { name: "search", in: "query", schema: {} },
    ]);
    expect(rows[0]).toMatchObject({ name: "status", type: "string", required: false, description: "Filter.", enumValues: ["open", "in-progress", "resolved"] });
    expect(rows[1]).toMatchObject({ required: true, example: "01JT" });
    expect(rows[2]).toMatchObject({ type: "string", description: undefined });
  });
});

describe("build-example", () => {
  it("builds a full response example from examples, enums and placeholders", () => {
    expect(buildExample(doc, schema("Ticket"))).toEqual({
      id: "01JTICKET",
      status: "open",
      assigneeId: "string",
      createdAt: "2026-01-15T10:30:00.000Z",
      tagIds: ["string"],
      customFields: {},
      comments: [{ id: "string", isInternal: true }],
      tree: { name: "string", children: [{}] },
    });
  });

  it("builds a request body with the required fields and the optional scalars that have an example", () => {
    expect(buildExample(doc, schema("CreateTicket"), "request")).toEqual({
      name: "Cannot log in",
      description: "<p>Help</p>",
      priority: "open",
    });
  });

  it("uses the schema example as a whole and arrays of the item example", () => {
    expect(buildExample(doc, schema("Error"))).toEqual({ statusCode: 404, message: "Ticket not found" });
    expect(buildExample(doc, { type: "array", items: schema("ApiMember") })).toEqual([{ userId: "01JUSER", role: "admin" }]);
    expect(buildExample(doc, undefined)).toBeUndefined();
  });
});

describe("operations", () => {
  const groups = groupOperations(doc);

  it("groups by tag in the declared order, untagged last", () => {
    expect(groups.map((g) => g.tag)).toEqual(["Tickets", "Members", "Other"]);
    expect(groups[0].operations.map((o) => `${o.method} ${o.path}`)).toEqual([
      "patch /api/v1/tickets/{id}",
      "get /api/v1/tickets",
      "post /api/v1/tickets",
    ]);
  });

  it("slugs operations from the operationId, or the method and path", () => {
    expect(operationSlug("get", "/api/v1/tickets", { operationId: "ApiController_listTickets" })).toBe("list-tickets");
    expect(operationSlug("get", "/api/v1/tickets/{id}/comments", {})).toBe("get-api-v1-tickets-id-comments");
    expect(findOperation(groups, "update-ticket")?.path).toBe("/api/v1/tickets/{id}");
    expect(findOperation(groups, "nope")).toBeUndefined();
  });

  it("merges path-level parameters, path parameters first", () => {
    expect(findOperation(groups, "update-ticket")!.parameters.map((p) => p.name)).toEqual(["id"]);
    expect(findOperation(groups, "list-tickets")!.parameters.map((p) => p.name)).toEqual(["status", "limit"]);
  });

  it("reads the required scope from the extension or the scope sentence", () => {
    expect(requiredScope(findOperation(groups, "list-members")!.operation)).toBe("members:read");
    expect(requiredScope(findOperation(groups, "update-ticket")!.operation)).toBe("tickets:write");
    expect(descriptionWithoutScope(findOperation(groups, "update-ticket")!.operation)).toBe("Changes fields.");
    expect(operationsByScope(groups).get("tickets:write")!.map((o) => o.slug)).toEqual(["update-ticket", "create-ticket"]);
  });

  it("lists every documented scope, falling back to the operations' scopes", () => {
    expect(documentScopes(doc).map((s) => s.scope)).toEqual(["tickets:read", "auth:exchange:admin"]);
    const withoutExtension = { ...doc, components: { ...doc.components, securitySchemes: {} } };
    expect(documentScopes(withoutExtension).map((s) => s.scope).sort()).toEqual(["members:read", "tickets:read", "tickets:write"]);
  });

  it("resolves request bodies and responses, sorted by status", () => {
    const op = findOperation(groups, "update-ticket")!.operation;
    expect(requestBodySchema(doc, op)).toEqual(schema("UpdateTicket"));
    expect(operationResponses(doc, op).map((r) => [r.status, r.description])).toEqual([["200", ""], ["404", "Not found"]]);
    expect(operationResponses(doc, op)[1].schema).toEqual(schema("Error"));
  });
});
