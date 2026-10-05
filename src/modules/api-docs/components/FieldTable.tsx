import useTranslation from "@modules/app/i18n/useTranslation";
import type { SchemaField } from "../domain/schema-fields";
import RichText from "./RichText";
import { C } from "./prose";

interface Props {
  fields: SchemaField[];
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Parameters or schema properties: name, type and flags on the left, description and values on the right. */
export default function FieldTable({ fields }: Props) {
  const { t } = useTranslation();

  if (fields.length === 0) return <p className="text-sm text-muted mb-4">{t("apiDocs.noFields")}</p>;

  return (
    <div className="rounded-lg border border-border-card overflow-hidden mb-4">
      {fields.map((field) => (
        <div
          key={field.path}
          className="flex flex-col sm:flex-row gap-1 sm:gap-4 px-3 py-2.5 border-t border-border-row first:border-t-0"
          style={{ paddingLeft: `${0.75 + field.depth * 1.25}rem` }}
        >
          <div className="sm:w-56 shrink-0 min-w-0">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
              {field.depth > 0 && <span className="text-subtle font-mono text-xs" aria-hidden>↳</span>}
              <span className="font-mono text-sm text-heading break-all">{field.name}</span>
              {field.required && <span className="text-exs font-body-semibold text-red-600 dark:text-red-400">{t("apiDocs.required")}</span>}
            </div>
            <div className="flex items-center flex-wrap gap-x-2 text-xs text-muted font-mono">
              <span>{field.type}</span>
              {field.nullable && <span className="text-subtle">{t("apiDocs.nullable")}</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <RichText text={field.description} />
            {field.enumValues && field.enumValues.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-muted mr-1">{t("apiDocs.values")}:</span>
                {field.enumValues.map((v) => <C key={v}>{v}</C>)}
              </div>
            )}
            {(field.example !== undefined || field.defaultValue !== undefined || field.constraints.length > 0) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {field.example !== undefined && (
                  <span>{t("apiDocs.example")}: <C>{formatValue(field.example)}</C></span>
                )}
                {field.defaultValue !== undefined && (
                  <span>{t("apiDocs.default")}: <C>{formatValue(field.defaultValue)}</C></span>
                )}
                {field.constraints.length > 0 && <span>{field.constraints.join(", ")}</span>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
