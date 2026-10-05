import { useMemo, useState } from "react";
import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { OpenApiDocument } from "../domain/openapi.types";
import {
  descriptionWithoutScope,
  operationResponses,
  requestBodySchema,
  requiredScope,
  type DocOperation,
} from "../domain/operations";
import { parameterFields, schemaFields } from "../domain/schema-fields";
import { buildExample } from "../domain/build-example";
import { buildRequest, initialRequestValues, type RequestValues } from "../domain/code-samples";
import { DOCS_ROUTES } from "../domain/docs-routes";
import MethodBadge from "./MethodBadge";
import FieldTable from "./FieldTable";
import RichText from "./RichText";
import CodeBlock from "./CodeBlock";
import CodeSamples from "./CodeSamples";
import TryItPanel from "./TryItPanel";
import StatusPill from "./StatusPill";
import CopyButton from "./CopyButton";
import { H2 } from "./prose";

interface Props {
  document: OpenApiDocument;
  op: DocOperation;
  baseUrl: string;
}

/** One operation of the reference. Mount it with key={op.slug} so the editor resets per operation. */
export default function OperationView({ document, op, baseUrl }: Props) {
  const { t } = useTranslation();
  const { operation, method, path, parameters } = op;

  const bodySchema = requestBodySchema(document, operation);
  const hasBody = bodySchema !== undefined;
  const scope = requiredScope(operation);
  const description = descriptionWithoutScope(operation);
  const responses = useMemo(() => operationResponses(document, operation), [document, operation]);
  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");

  const [values, setValues] = useState<RequestValues>(() =>
    initialRequestValues(parameters, hasBody ? buildExample(document, bodySchema, "request") : undefined),
  );

  // The samples follow what is typed in "Try it", always with the placeholder key
  const sampleRequest = buildRequest(baseUrl, method, path, values, { hasBody });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-8">
      <article className="min-w-0">
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <MethodBadge method={method} />
          <code className="font-mono text-sm text-heading break-all">{path}</code>
          <CopyButton text={`${baseUrl}${path}`} className="!border-border-card !text-muted hover:!text-heading ml-1" />
        </div>
        <h1 className="text-2xl font-body-bold text-heading mb-3">{operation.summary ?? `${method.toUpperCase()} ${path}`}</h1>

        {scope && (
          <p className="text-sm mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-muted">{t("apiDocs.requiredScope")}:</span>
            <Link
              to={DOCS_ROUTES.guide("scopes")}
              className="font-mono text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
            >
              {scope}
            </Link>
          </p>
        )}

        <RichText text={description} className="text-sm text-body leading-relaxed mb-2" />

        {pathParams.length > 0 && (
          <>
            <H2>{t("apiDocs.pathParams")}</H2>
            <FieldTable fields={parameterFields(document, pathParams)} />
          </>
        )}

        {queryParams.length > 0 && (
          <>
            <H2>{t("apiDocs.queryParams")}</H2>
            <FieldTable fields={parameterFields(document, queryParams)} />
          </>
        )}

        {hasBody && (
          <>
            <H2>{t("apiDocs.requestBody")}</H2>
            <p className="text-xs text-muted font-mono mb-2">application/json</p>
            <FieldTable fields={schemaFields(document, bodySchema)} />
          </>
        )}

        <H2>{t("apiDocs.responses")}</H2>
        <div className="space-y-3">
          {responses.map((response) => {
            const fields = response.schema ? schemaFields(document, response.schema) : [];
            const isSuccess = response.status.startsWith("2");
            return (
              <details key={response.status} open={isSuccess} className="group rounded-lg border border-border-card">
                <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                  <StatusPill status={response.status} />
                  <div className="flex-1 min-w-0">
                    <RichText text={response.description || (isSuccess ? "OK" : "")} className="text-sm text-body" />
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted transition-transform group-open:rotate-180 shrink-0" aria-hidden>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                {response.schema && (
                  <div className="px-3 pb-3 space-y-3">
                    {fields.length > 0 && <FieldTable fields={fields} />}
                    <CodeBlock
                      label={t("apiDocs.exampleResponse")}
                      code={JSON.stringify(buildExample(document, response.schema, "response"), null, 2)}
                      className="max-h-[420px] overflow-y-auto"
                    />
                  </div>
                )}
              </details>
            );
          })}
        </div>
      </article>

      <aside className="min-w-0 space-y-6 xl:sticky xl:top-20 xl:self-start xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:pb-4">
        <CodeSamples request={sampleRequest} />
        <TryItPanel
          document={document}
          baseUrl={baseUrl}
          method={method}
          path={path}
          parameters={parameters}
          hasBody={hasBody}
          values={values}
          onChange={setValues}
        />
      </aside>
    </div>
  );
}
