import CodeBlock from "../components/CodeBlock";
import { C, H1, H2, Lead, Note, OL, P, UL } from "../components/prose";
import { DOCS_ROUTES } from "../domain/docs-routes";
import DocLink from "./DocLink";
import type { GuideProps } from "./guide-types";

const firstResponse = `{
  "items": [
    {
      "id": "01JABCDEF0123456789ABCDEFG",
      "ticketNumber": "TK-000042",
      "name": "Cannot log in to the portal",
      "status": "open",
      "priority": "medium",
      ...
    }
  ],
  "total": 57,
  "page": 1,
  "limit": 5
}`;

function firstRequest(baseUrl: string): string {
  return `curl '${baseUrl}/api/v1/tickets?limit=5' \\\n  -H 'Authorization: Bearer ohd_your_key'`;
}

export default function IntroductionGuide({ lang, baseUrl }: GuideProps) {
  const apiBase = `${baseUrl}/api/v1`;

  if (lang === "es") {
    return (
      <>
        <H1>Primeros pasos</H1>
        <Lead>
          La API REST pública de Open Helpdesk, para integraciones que leen y modifican los tickets de un espacio de trabajo.
        </Lead>

        <H2>1. Crea una clave API</H2>
        <OL>
          <li>
            En la aplicación web, abre <strong>Ajustes → Claves API</strong> del espacio de trabajo. Necesitas permiso para
            gestionar los ajustes del espacio.
          </li>
          <li>Crea una clave, elige sus permisos (scopes) y, si quieres, una fecha de caducidad.</li>
          <li>
            La clave (<C>ohd_...</C>) se muestra una sola vez. Guárdala como un secreto, en el servidor de tu integración.
          </li>
        </OL>

        <H2>2. URL base</H2>
        <P>Todos los endpoints de esta API están bajo <C>/api/v1</C>. En esta instancia:</P>
        <CodeBlock code={apiBase} label="Base URL" className="mb-4" />
        <P>Las peticiones y respuestas son JSON.</P>

        <H2>3. Primera petición</H2>
        <P>Lista los cinco tickets más recientes enviando la clave como token bearer:</P>
        <CodeBlock code={firstRequest(baseUrl)} label="cURL" className="mb-4" />
        <P>La respuesta es una página de tickets:</P>
        <CodeBlock code={firstResponse} label="JSON" className="mb-4" />

        <H2>Siguientes pasos</H2>
        <UL>
          <li><DocLink to={DOCS_ROUTES.guide("authentication")}>Autenticación</DocLink>: qué puede hacer una clave y cuándo deja de funcionar.</li>
          <li><DocLink to={DOCS_ROUTES.guide("scopes")}>Permisos</DocLink>: qué permiso necesita cada operación.</li>
          <li><DocLink to={DOCS_ROUTES.guide("errors")}>Errores</DocLink> y <DocLink to={DOCS_ROUTES.guide("rate-limits")}>límites de peticiones</DocLink>.</li>
          <li>La referencia de cada endpoint, con ejemplos de código y un panel para probarlo, está en la barra lateral.</li>
        </UL>
        <Note>
          No uses una clave API desde código que se ejecuta en el navegador de tus usuarios: cualquiera podría leerla.
        </Note>
      </>
    );
  }

  return (
    <>
      <H1>Getting started</H1>
      <Lead>The public REST API of Open Helpdesk, for integrations that read and write the tickets of one workspace.</Lead>

      <H2>1. Create an API key</H2>
      <OL>
        <li>
          In the web app, open the workspace <strong>Settings → API Keys</strong>. It needs permission to manage the workspace
          settings.
        </li>
        <li>Create a key, choose its scopes and, optionally, an expiry date.</li>
        <li>
          The key (<C>ohd_...</C>) is shown once. Store it as a secret, on your integration's server.
        </li>
      </OL>

      <H2>2. Base URL</H2>
      <P>Every endpoint of this API lives under <C>/api/v1</C>. On this instance:</P>
      <CodeBlock code={apiBase} label="Base URL" className="mb-4" />
      <P>Requests and responses are JSON.</P>

      <H2>3. Your first request</H2>
      <P>List the five most recent tickets, sending the key as a bearer token:</P>
      <CodeBlock code={firstRequest(baseUrl)} label="cURL" className="mb-4" />
      <P>The response is a page of tickets:</P>
      <CodeBlock code={firstResponse} label="JSON" className="mb-4" />

      <H2>Next steps</H2>
      <UL>
        <li><DocLink to={DOCS_ROUTES.guide("authentication")}>Authentication</DocLink>: what a key can do and when it stops working.</li>
        <li><DocLink to={DOCS_ROUTES.guide("scopes")}>Scopes</DocLink>: the scope each operation requires.</li>
        <li><DocLink to={DOCS_ROUTES.guide("errors")}>Errors</DocLink> and <DocLink to={DOCS_ROUTES.guide("rate-limits")}>rate limits</DocLink>.</li>
        <li>The reference of every endpoint, with code samples and a panel to try it, is in the sidebar.</li>
      </UL>
      <Note>Never use an API key from code that runs in your users' browsers: anyone could read it.</Note>
    </>
  );
}
