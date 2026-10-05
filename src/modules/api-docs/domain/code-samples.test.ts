import { describe, expect, it } from "vitest";
import {
  API_KEY_PLACEHOLDER,
  buildRequest,
  buildUrl,
  initialRequestValues,
  toCurl,
  toFetch,
  toPython,
  toPythonLiteral,
} from "./code-samples";

const BASE = "https://help.example.com/api/";

describe("request values and URL", () => {
  it("prefills path and required query parameters from examples", () => {
    const values = initialRequestValues(
      [
        { name: "id", in: "path", required: true, schema: { example: "01JT" } },
        { name: "slug", in: "path", required: true },
        { name: "limit", in: "query", schema: { example: 20 } },
        { name: "mode", in: "query", required: true, example: "full" },
      ],
      { name: "x" },
    );
    expect(values).toEqual({ path: { id: "01JT", slug: "" }, query: { mode: "full" }, body: '{\n  "name": "x"\n}' });
    expect(initialRequestValues([], undefined).body).toBe("");
  });

  it("fills and encodes path parameters, keeps a placeholder for empty ones, skips empty query values", () => {
    expect(buildUrl(BASE, "/api/v1/tickets/{id}", { path: { id: "a b/c" }, query: {} })).toBe("https://help.example.com/api/api/v1/tickets/a%20b%2Fc");
    expect(buildUrl(BASE, "/api/v1/tickets/{id}", { path: {}, query: { search: " TK-42 ", status: "" } })).toBe(
      "https://help.example.com/api/api/v1/tickets/:id?search=TK-42",
    );
  });

  it("uses the placeholder key unless one is given, and sends a body only when there is one", () => {
    const values = { path: {}, query: {}, body: '{"a":1}' };
    expect(buildRequest(BASE, "post", "/x", values, { hasBody: true })).toEqual({
      method: "post",
      url: "https://help.example.com/api/x",
      headers: [["Authorization", `Bearer ${API_KEY_PLACEHOLDER}`], ["Content-Type", "application/json"]],
      body: '{"a":1}',
    });
    expect(buildRequest(BASE, "get", "/x", values, { hasBody: false, apiKey: " ohd_real " })).toEqual({
      method: "get",
      url: "https://help.example.com/api/x",
      headers: [["Authorization", "Bearer ohd_real"]],
      body: undefined,
    });
  });
});

describe("code samples", () => {
  const post = buildRequest(BASE, "post", "/api/v1/tickets", { path: {}, query: {}, body: '{"name":"It\'s down","urgent":true,"tags":[],"x":null}' }, { hasBody: true });
  const get = buildRequest(BASE, "get", "/api/v1/members", { path: {}, query: {}, body: "" }, { hasBody: false });

  it("generates cURL with quoted URL, headers and an escaped body", () => {
    expect(toCurl(get)).toBe(`curl 'https://help.example.com/api/api/v1/members' \\\n  -H 'Authorization: Bearer ohd_...'`);
    const curl = toCurl(post);
    expect(curl).toContain("curl -X POST 'https://help.example.com/api/api/v1/tickets'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain(`"name": "It'\\''s down"`);
  });

  it("generates fetch with method, headers and JSON.stringify of the body", () => {
    const js = toFetch(post);
    expect(js).toContain('const response = await fetch("https://help.example.com/api/api/v1/tickets", {');
    expect(js).toContain('  method: "POST",');
    expect(js).toContain('    "Authorization": "Bearer ohd_...",');
    expect(js).toContain('  body: JSON.stringify({\n    "name": "It\'s down",');
    expect(toFetch(get)).not.toContain("method:");
  });

  it("generates Python requests with json= and Python literals", () => {
    const py = toPython(post);
    expect(py).toContain("response = requests.post(");
    expect(py).toContain('    json={\n        "name": "It\'s down",\n        "urgent": True,\n        "tags": [],\n        "x": None,\n    },');
    expect(py).not.toContain("Content-Type");
    expect(toPython(get)).toContain("requests.get(");
  });

  it("passes an invalid JSON body through as text", () => {
    const raw = buildRequest(BASE, "post", "/x", { path: {}, query: {}, body: "{oops" }, { hasBody: true });
    expect(toCurl(raw)).toContain("-d '{oops'");
    expect(toFetch(raw)).toContain('body: "{oops",');
    expect(toPython(raw)).toContain('data="{oops",');
    expect(toPython(raw)).toContain('"Content-Type": "application/json"');
  });

  it("writes nested Python literals", () => {
    expect(toPythonLiteral({ a: [1, { b: false }] })).toBe('{\n    "a": [\n        1,\n        {\n            "b": False,\n        },\n    ],\n}');
  });
});
