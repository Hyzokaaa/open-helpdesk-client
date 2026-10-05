import CodeBlock from "../components/CodeBlock";
import { C, H1, H2, Lead, Note, OL, P, UL } from "../components/prose";
import { DOCS_ROUTES } from "../domain/docs-routes";
import DocLink from "./DocLink";
import type { GuideProps } from "./guide-types";

function exchangeRequest(baseUrl: string): string {
  return `curl -X POST '${baseUrl}/api/v1/auth/exchange' \\
  -H 'Authorization: Bearer ohd_your_key' \\
  -H 'Content-Type: application/json' \\
  -d '{ "email": "jane@example.com", "firstName": "Jane", "lastName": "Doe", "role": "agent" }'`;
}

const EXCHANGE_RESPONSE = `{
  "accessToken": "eyJhbGciOi...",
  "user": { "id": "01JABCDEF0123456789ABCDEFG", "email": "jane@example.com" }
}`;

export default function DelegatedSignInGuide({ lang, baseUrl }: GuideProps) {
  const operationLink = DOCS_ROUTES.operation("exchange-token");

  if (lang === "es") {
    return (
      <>
        <H1>Inicio de sesión delegado</H1>
        <Lead>
          <DocLink to={operationLink}><C>POST /api/v1/auth/exchange</C></DocLink> permite que tu aplicación inicie la sesión
          de sus propios usuarios en Open Helpdesk sin contraseña, para el inicio de sesión único desde tu producto. Requiere
          el permiso <C>auth:exchange</C>.
        </Lead>

        <H2>Flujo</H2>
        <OL>
          <li>
            Tu <strong>backend</strong> llama al endpoint con la clave y el <C>email</C>, <C>firstName</C>, <C>lastName</C> y,
            opcionalmente, el <C>role</C> del usuario (por defecto <C>agent</C>). Nunca lo llames desde un navegador: la clave
            quedaría expuesta.
          </li>
          <li>
            Si ninguna cuenta tiene ese email, se crea una (email ya verificado, contraseña aleatoria) y se añade al espacio de
            la clave con <C>role</C>. Si la cuenta existe, ya debe ser miembro del espacio; su nombre se actualiza si cambió y
            conserva su rol.
          </li>
          <li>
            La respuesta incluye <C>accessToken</C>, un token de sesión normal de Open Helpdesk (JWT) para ese usuario. Dura lo
            que el servidor fije en <C>API_TOKEN_EXCHANGE_EXPIRATION</C> (un día por defecto) y llega{" "}
            <strong>sin refresh token</strong>: cuando caduque, vuelve a llamar al intercambio.
          </li>
          <li>
            Usa el token como <C>Authorization: Bearer &lt;accessToken&gt;</C> contra los endpoints que usa la aplicación web,
            con los permisos propios del usuario.
          </li>
        </OL>
        <CodeBlock code={exchangeRequest(baseUrl)} label="cURL" className="mb-4" />
        <CodeBlock code={EXCHANGE_RESPONSE} label="JSON" className="mb-4" />

        <H2>Abrir la aplicación web con la sesión iniciada</H2>
        <P>
          La aplicación web solo lee su sesión de la clave <C>access_token</C> del <C>localStorage</C> del navegador, en su
          propio dominio. Una página servida desde el dominio del helpdesk tiene que guardar el token ahí antes de abrir la
          aplicación; la aplicación web no tiene ningún parámetro de URL que acepte un token, y una página en otro dominio no
          puede escribir en ese almacenamiento.
        </P>

        <H2>Restricciones</H2>
        <UL>
          <li>El intercambio nunca inicia la sesión de administradores del sistema, usuarios desactivados ni usuarios de otros espacios (<C>403</C>).</li>
          <li>
            Crear o iniciar la sesión de un <C>supervisor</C> o un <C>admin</C> requiere además el permiso{" "}
            <C>auth:exchange:admin</C>.
          </li>
        </UL>
        <Note tone="warning">
          <C>auth:exchange:admin</C> da a quien tenga la clave el control de todo el espacio de trabajo. Concédelo solo si lo
          necesitas.
        </Note>
      </>
    );
  }

  return (
    <>
      <H1>Delegated sign-in</H1>
      <Lead>
        <DocLink to={operationLink}><C>POST /api/v1/auth/exchange</C></DocLink> lets your application sign its own users into
        Open Helpdesk without a password, for single sign-on from your product. It requires the <C>auth:exchange</C> scope.
      </Lead>

      <H2>Flow</H2>
      <OL>
        <li>
          Your <strong>backend</strong> calls the endpoint with the key and the user's <C>email</C>, <C>firstName</C>,{" "}
          <C>lastName</C> and, optionally, <C>role</C> (default <C>agent</C>). Never call it from a browser: the key would be
          exposed.
        </li>
        <li>
          If no account has that email, one is created (email already verified, random password) and added to the key's
          workspace with <C>role</C>. If the account exists, it must already be a member of the workspace; its name is updated
          if it changed and its role is kept.
        </li>
        <li>
          The response carries <C>accessToken</C>, a regular Open Helpdesk session token (JWT) for that user. It lasts what the
          server sets in <C>API_TOKEN_EXCHANGE_EXPIRATION</C> (one day by default) and comes{" "}
          <strong>without a refresh token</strong>: when it expires, call the exchange again.
        </li>
        <li>
          Use the token as <C>Authorization: Bearer &lt;accessToken&gt;</C> against the endpoints the web app uses, with the
          user's own permissions.
        </li>
      </OL>
      <CodeBlock code={exchangeRequest(baseUrl)} label="cURL" className="mb-4" />
      <CodeBlock code={EXCHANGE_RESPONSE} label="JSON" className="mb-4" />

      <H2>Opening the web app signed in</H2>
      <P>
        The web app only reads its session from the <C>localStorage</C> key <C>access_token</C> of the browser, on its own
        domain. A page served from the helpdesk's domain has to store the token there before opening the app; the web app has
        no URL parameter that accepts a token, and a page on another domain cannot write to that storage.
      </P>

      <H2>Restrictions</H2>
      <UL>
        <li>The exchange never signs in system administrators, deactivated users or users of other workspaces (<C>403</C>).</li>
        <li>
          Creating or signing in a <C>supervisor</C> or <C>admin</C> additionally requires the <C>auth:exchange:admin</C> scope.
        </li>
      </UL>
      <Note tone="warning">
        <C>auth:exchange:admin</C> gives whoever holds the key control of the whole workspace. Grant it only when you need it.
      </Note>
    </>
  );
}
