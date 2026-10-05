import type { HttpMethod, ParameterObject } from "./openapi.types";

export const API_KEY_PLACEHOLDER = "ohd_...";

export interface RequestValues {
  path: Record<string, string>;
  query: Record<string, string>;
  /** Raw JSON text of the body, as typed in the editor. Empty means no body. */
  body: string;
}

export interface RequestSpec {
  method: HttpMethod;
  url: string;
  headers: [string, string][];
  /** The body as JSON text, or undefined when the operation sends none. */
  body?: string;
}

/** Initial values for an operation: path and required query parameters from their examples. */
export function initialRequestValues(parameters: ParameterObject[], bodyExample: unknown): RequestValues {
  const path: Record<string, string> = {};
  const query: Record<string, string> = {};
  for (const p of parameters) {
    const example = p.example ?? p.schema?.example;
    if (p.in === "path") path[p.name] = example === undefined ? "" : String(example);
    if (p.in === "query" && p.required && example !== undefined) query[p.name] = String(example);
  }
  return { path, query, body: bodyExample === undefined ? "" : JSON.stringify(bodyExample, null, 2) };
}

/** Joins the base URL and the path, filling path parameters and appending the non-empty query values. */
export function buildUrl(baseUrl: string, path: string, values: Pick<RequestValues, "path" | "query">): string {
  const filled = path.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = values.path[name]?.trim();
    return value ? encodeURIComponent(value) : `:${name}`;
  });
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(values.query)) {
    if (value.trim() !== "") query.append(name, value.trim());
  }
  const search = query.toString();
  return `${baseUrl.replace(/\/+$/, "")}${filled}${search ? `?${search}` : ""}`;
}

export function buildRequest(
  baseUrl: string,
  method: HttpMethod,
  path: string,
  values: RequestValues,
  options: { apiKey?: string; hasBody: boolean },
): RequestSpec {
  const headers: [string, string][] = [["Authorization", `Bearer ${options.apiKey?.trim() || API_KEY_PLACEHOLDER}`]];
  const body = options.hasBody && values.body.trim() !== "" ? values.body : undefined;
  if (body !== undefined) headers.push(["Content-Type", "application/json"]);
  return { method, url: buildUrl(baseUrl, path, values), headers, body };
}

/** The body re-indented when it is valid JSON, so samples stay tidy while the editor holds anything. */
function parsedBody(body: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false };
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function toCurl(request: RequestSpec): string {
  const lines = [`curl${request.method === "get" ? "" : ` -X ${request.method.toUpperCase()}`} ${shellQuote(request.url)}`];
  for (const [name, value] of request.headers) lines.push(`  -H ${shellQuote(`${name}: ${value}`)}`);
  if (request.body !== undefined) {
    const parsed = parsedBody(request.body);
    lines.push(`  -d ${shellQuote(parsed.ok ? JSON.stringify(parsed.value, null, 2) : request.body)}`);
  }
  return lines.join(" \\\n");
}

function indentAfterFirstLine(text: string, indent: string): string {
  return text.split("\n").join(`\n${indent}`);
}

export function toFetch(request: RequestSpec): string {
  const options: string[] = [];
  if (request.method !== "get") options.push(`  method: ${JSON.stringify(request.method.toUpperCase())},`);
  options.push("  headers: {");
  for (const [name, value] of request.headers) options.push(`    ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
  options.push("  },");
  if (request.body !== undefined) {
    const parsed = parsedBody(request.body);
    options.push(
      parsed.ok
        ? `  body: JSON.stringify(${indentAfterFirstLine(JSON.stringify(parsed.value, null, 2), "  ")}),`
        : `  body: ${JSON.stringify(request.body)},`,
    );
  }
  return [
    `const response = await fetch(${JSON.stringify(request.url)}, {`,
    ...options,
    "});",
    "const data = await response.json();",
    "console.log(response.status, data);",
  ].join("\n");
}

/** A JSON value written as a Python literal (True/False/None), indented by four spaces per level. */
export function toPythonLiteral(value: unknown, level = 0): string {
  const pad = "    ".repeat(level + 1);
  const close = "    ".repeat(level);
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((v) => `${pad}${toPythonLiteral(v, level + 1)},`).join("\n")}\n${close}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  return `{\n${entries.map(([k, v]) => `${pad}${JSON.stringify(k)}: ${toPythonLiteral(v, level + 1)},`).join("\n")}\n${close}}`;
}

export function toPython(request: RequestSpec): string {
  const parsed = request.body === undefined ? undefined : parsedBody(request.body);
  // requests sets Content-Type itself for json=; raw text keeps the header
  const headers = parsed?.ok ? request.headers.filter(([name]) => name !== "Content-Type") : request.headers;
  const args = [`    ${JSON.stringify(request.url)},`, `    headers=${toPythonLiteral(Object.fromEntries(headers), 1)},`];
  if (parsed) args.push(parsed.ok ? `    json=${toPythonLiteral(parsed.value, 1)},` : `    data=${JSON.stringify(request.body)},`);
  return ["import requests", "", `response = requests.${request.method}(`, ...args, ")", "print(response.status_code, response.json())"].join("\n");
}

export type SampleLanguage = "curl" | "javascript" | "python";

export const SAMPLE_GENERATORS: Record<SampleLanguage, { label: string; generate: (request: RequestSpec) => string }> = {
  curl: { label: "cURL", generate: toCurl },
  javascript: { label: "JavaScript", generate: toFetch },
  python: { label: "Python", generate: toPython },
};
