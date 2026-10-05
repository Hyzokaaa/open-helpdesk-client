import { Fragment } from "react";
import { C, H1, H2, Lead, Note, P, Table } from "../components/prose";
import { renderInline } from "../components/RichText";
import MethodBadge from "../components/MethodBadge";
import { DOCS_ROUTES } from "../domain/docs-routes";
import { documentScopes, operationsByScope } from "../domain/operations";
import DocLink from "./DocLink";
import type { DocsLang, GuideProps } from "./guide-types";

/**
 * Spanish wording of the scope descriptions. The list of scopes, and the English text, come
 * from the API document; a scope missing here falls back to the document's description.
 */
const SCOPE_DESCRIPTIONS_ES: Record<string, string> = {
  "tickets:read": "Listar tickets y leer un ticket.",
  "tickets:write": "Crear, actualizar (campos, estado, asignado) y eliminar tickets.",
  "comments:read": "Listar los comentarios de un ticket.",
  "comments:write": "Añadir comentarios a un ticket.",
  "members:read": "Listar los miembros del espacio de trabajo.",
  "auth:exchange": "Crear usuarios y agentes del espacio de trabajo e iniciar su sesión (inicio de sesión delegado).",
  "auth:exchange:admin":
    "Junto con `auth:exchange`: también crear e iniciar la sesión de supervisores y administradores del espacio. Nunca se concede por defecto.",
};

const TEXT: Record<DocsLang, Record<string, string>> = {
  en: {
    title: "Scopes",
    lead: "Each operation requires one scope. A key can only call the operations whose scope it holds.",
    scope: "Scope",
    allows: "Allows",
    byDefault: "Default",
    operations: "Operations",
    yes: "yes",
    no: "no",
    defaultsTitle: "Keys created without choosing scopes",
    loading: "The scopes table appears once the API reference has loaded.",
  },
  es: {
    title: "Permisos (scopes)",
    lead: "Cada operación requiere un permiso. Una clave solo puede llamar a las operaciones cuyo permiso tiene.",
    scope: "Permiso",
    allows: "Permite",
    byDefault: "Por defecto",
    operations: "Operaciones",
    yes: "sí",
    no: "no",
    defaultsTitle: "Claves creadas sin elegir permisos",
    loading: "La tabla de permisos aparece cuando se carga la referencia de la API.",
  },
};

export default function ScopesGuide({ lang, document, groups }: GuideProps) {
  const text = TEXT[lang];
  const scopes = document ? documentScopes(document) : [];
  const byScope = operationsByScope(groups);
  const notDefault = scopes.filter((s) => !s.default).map((s) => s.scope);

  return (
    <>
      <H1>{text.title}</H1>
      <Lead>{text.lead}</Lead>

      {scopes.length === 0 ? (
        <P className="text-muted">{text.loading}</P>
      ) : (
        <Table
          head={[text.scope, text.allows, text.byDefault, text.operations]}
          rows={scopes.map((s) => [
            <span className="font-mono text-xs whitespace-nowrap text-heading">{s.scope}</span>,
            renderInline((lang === "es" && SCOPE_DESCRIPTIONS_ES[s.scope]) || s.description),
            s.default ? text.yes : text.no,
            <div className="flex flex-col gap-1">
              {(byScope.get(s.scope) ?? []).map((op) => (
                <Fragment key={op.slug}>
                  <DocLink to={DOCS_ROUTES.operation(op.slug)}>
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <MethodBadge method={op.method} size="sm" />
                      <span className="text-xs">{op.operation.summary ?? op.path}</span>
                    </span>
                  </DocLink>
                </Fragment>
              ))}
            </div>,
          ])}
        />
      )}

      <H2>{text.defaultsTitle}</H2>
      {lang === "es" ? (
        <P>
          Una clave creada sin elegir permisos recibe todos
          {notDefault.length > 0 && <> excepto {notDefault.map((s, i) => <Fragment key={s}>{i > 0 && ", "}<C>{s}</C></Fragment>)}</>}.
        </P>
      ) : (
        <P>
          A key created without choosing scopes gets every scope
          {notDefault.length > 0 && <> except {notDefault.map((s, i) => <Fragment key={s}>{i > 0 && ", "}<C>{s}</C></Fragment>)}</>}.
        </P>
      )}
      <Note>
        {lang === "es" ? (
          <>
            Los permisos limitan la clave, no la amplían: el rol del usuario que creó la clave sigue decidiendo qué puede
            hacer. Ver <DocLink to={DOCS_ROUTES.guide("authentication")}>Autenticación</DocLink>.
          </>
        ) : (
          <>
            Scopes narrow a key, they never widen it: the role of the user who created the key still decides what it may do.
            See <DocLink to={DOCS_ROUTES.guide("authentication")}>Authentication</DocLink>.
          </>
        )}
      </Note>
    </>
  );
}
