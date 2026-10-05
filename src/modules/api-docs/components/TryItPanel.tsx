import { useState } from "react";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import Button from "@modules/app/modules/ui/components/Button/Button";
import { inputClass } from "@modules/app/modules/ui/shared/domain/input-class";
import type { HttpMethod, OpenApiDocument, ParameterObject } from "../domain/openapi.types";
import { buildRequest, type RequestValues } from "../domain/code-samples";
import { resolveSchema } from "../domain/resolve-ref";
import useStoredApiKey from "../hooks/useStoredApiKey";
import CodeBlock from "./CodeBlock";
import StatusPill from "./StatusPill";

interface Props {
  document: OpenApiDocument;
  baseUrl: string;
  method: HttpMethod;
  path: string;
  parameters: ParameterObject[];
  hasBody: boolean;
  values: RequestValues;
  onChange: (values: RequestValues) => void;
}

interface Result {
  status: number;
  statusText: string;
  durationMs: number;
  headers: [string, string][];
  body: string;
}

const FIELD = inputClass({ size: "sm", full: true });

function prettyBody(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function ParameterInput({ document, parameter, value, onChange }: {
  document: OpenApiDocument;
  parameter: ParameterObject;
  value: string;
  onChange: (value: string) => void;
}) {
  const schema = resolveSchema(document, parameter.schema).schema;
  const example = parameter.example ?? schema.example;
  const id = `try-${parameter.in}-${parameter.name}`;

  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-mono text-secondary-text mb-1">
        {parameter.name}
        {parameter.required && <span className="text-red-600 dark:text-red-400">*</span>}
      </label>
      {schema.enum ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
          <option value="">—</option>
          {schema.enum.map((v) => (
            <option key={String(v)} value={String(v)}>{String(v)}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={example === undefined ? "" : String(example)}
          className={FIELD}
          autoComplete="off"
          spellCheck={false}
        />
      )}
    </div>
  );
}

/**
 * Sends the operation to this instance from the browser with the key typed here. The request
 * crosses origins like the rest of the app's API calls, so only the response headers the API
 * exposes through CORS are visible.
 */
export default function TryItPanel({ document, baseUrl, method, path, parameters, hasBody, values, onChange }: Props) {
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useStoredApiKey();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");

  const setParam = (location: "path" | "query", name: string, value: string) =>
    onChange({ ...values, [location]: { ...values[location], [name]: value } });

  const send = async () => {
    setError(null);
    if (!apiKey.trim()) return setError(t("apiDocs.missingKey"));
    if (hasBody && values.body.trim()) {
      try {
        JSON.parse(values.body);
      } catch {
        return setError(t("apiDocs.invalidJson"));
      }
    }

    const request = buildRequest(baseUrl, method, path, values, { apiKey, hasBody });
    setSending(true);
    const started = performance.now();
    try {
      const response = await fetch(request.url, {
        method: request.method.toUpperCase(),
        headers: Object.fromEntries(request.headers),
        body: request.body,
        credentials: "omit",
      });
      const text = await response.text();
      setResult({
        status: response.status,
        statusText: response.statusText,
        durationMs: Math.round(performance.now() - started),
        headers: [...response.headers.entries()],
        body: prettyBody(text),
      });
    } catch {
      setResult(null);
      setError(t("apiDocs.requestFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-lg border border-border-card bg-surface p-4 space-y-4">
      <div>
        <h3 className="text-xs font-body-semibold text-subtle uppercase tracking-wide mb-1">{t("apiDocs.tryIt")}</h3>
        <p className="text-xs text-muted">{t("apiDocs.tryItWarning")}</p>
      </div>

      <div>
        <label htmlFor="try-api-key" className="block text-xs font-body-medium text-secondary-text mb-1">{t("apiDocs.apiKey")}</label>
        <div className="flex gap-2">
          <input
            id="try-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="ohd_..."
            className={clsx(FIELD, "font-mono")}
            autoComplete="off"
            spellCheck={false}
          />
          {apiKey && (
            <Button size="xs" color="light" onClick={() => setApiKey("")}>{t("apiDocs.forgetKey")}</Button>
          )}
        </div>
        <p className="text-exs text-subtle mt-1">{t("apiDocs.apiKeyHint")}</p>
      </div>

      {pathParams.length > 0 && (
        <fieldset className="space-y-2 min-w-0">
          <legend className="text-xs font-body-medium text-secondary-text mb-1">{t("apiDocs.pathParams")}</legend>
          {pathParams.map((p) => (
            <ParameterInput key={p.name} document={document} parameter={p} value={values.path[p.name] ?? ""} onChange={(v) => setParam("path", p.name, v)} />
          ))}
        </fieldset>
      )}

      {queryParams.length > 0 && (
        <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
          <legend className="text-xs font-body-medium text-secondary-text mb-1">{t("apiDocs.queryParams")}</legend>
          {queryParams.map((p) => (
            <ParameterInput key={p.name} document={document} parameter={p} value={values.query[p.name] ?? ""} onChange={(v) => setParam("query", p.name, v)} />
          ))}
        </fieldset>
      )}

      {hasBody && (
        <div>
          <label htmlFor="try-body" className="block text-xs font-body-medium text-secondary-text mb-1">{t("apiDocs.requestBody")} (JSON)</label>
          <textarea
            id="try-body"
            value={values.body}
            onChange={(e) => onChange({ ...values, body: e.target.value })}
            rows={Math.min(16, Math.max(4, values.body.split("\n").length + 1))}
            className={clsx(FIELD, "font-mono text-xs leading-relaxed resize-y")}
            spellCheck={false}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={send} loading={sending} size="base">{t("apiDocs.send")}</Button>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="space-y-3 pt-1" aria-live="polite">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted text-xs">{t("apiDocs.status")}</span>
            <StatusPill status={result.status} />
            <span className="text-body text-xs">{result.statusText}</span>
            <span className="text-subtle text-xs ml-auto">{result.durationMs} ms</span>
          </div>
          <details>
            <summary className="text-xs text-secondary-text cursor-pointer select-none">{t("apiDocs.headers")} ({result.headers.length})</summary>
            <div className="mt-2 rounded border border-border-card divide-y divide-border-row">
              {result.headers.map(([name, value]) => (
                <div key={name} className="flex gap-3 px-2 py-1 text-xs font-mono">
                  <span className="text-muted shrink-0">{name}</span>
                  <span className="text-body break-all">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-exs text-subtle mt-1">{t("apiDocs.headersNote")}</p>
          </details>
          <CodeBlock code={result.body || " "} label={t("apiDocs.body")} className="max-h-[480px] overflow-y-auto" />
        </div>
      )}
    </section>
  );
}
