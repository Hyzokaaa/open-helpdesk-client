import CodeBlock from "../components/CodeBlock";
import { C, H1, H2, Lead, Note, P, Table, UL } from "../components/prose";
import { DOCS_ROUTES } from "../domain/docs-routes";
import DocLink from "./DocLink";
import type { GuideProps } from "./guide-types";

const HEADER = "Authorization: Bearer ohd_your_key";

export default function AuthenticationGuide({ lang }: GuideProps) {
  if (lang === "es") {
    return (
      <>
        <H1>Autenticación</H1>
        <Lead>Cada petición se autentica con una clave API del espacio de trabajo, enviada como token bearer.</Lead>
        <CodeBlock code={HEADER} label="HTTP" className="mb-6" />

        <H2>Qué puede hacer una clave</H2>
        <UL>
          <li>
            Una clave pertenece al espacio de trabajo en el que se creó. Cada petición actúa solo sobre ese espacio; no hay
            slug del espacio en la URL.
          </li>
          <li>
            Una clave actúa con el <strong>rol en el espacio del usuario que la creó</strong>. Los{" "}
            <DocLink to={DOCS_ROUTES.guide("scopes")}>permisos (scopes)</DocLink> limitan qué puede llamar la clave, y el rol
            de su creador sigue decidiendo qué puede hacer: una clave creada por un agente no puede eliminar tickets aunque
            tenga <C>tickets:write</C>.
          </li>
          <li>Las claves solo se aceptan en <C>/api/v1</C>. En cualquier otro endpoint se rechazan con <C>401</C>.</li>
        </UL>

        <H2>Cuándo deja de funcionar</H2>
        <Table
          head={["Situación", "Respuesta"]}
          rows={[
            ["Falta la cabecera Authorization", <C>401</C>],
            ["La clave ha caducado", <C>401</C>],
            ["El usuario que creó la clave está desactivado", <C>401</C>],
            [<>La clave no existe o fue revocada (<C>"Forbidden resource"</C>)</>, <C>403</C>],
            [<>La clave no tiene el permiso de la operación (<C>"Insufficient API key permissions"</C>)</>, <C>403</C>],
            ["El rol del creador no permite la acción", <C>403</C>],
          ]}
        />
        <P>
          Cuando el creador de una clave se desactiva, sus claves dejan de funcionar. Si se reactiva, vuelven a funcionar si
          no han caducado ni se han revocado.
        </P>
        <Note tone="warning">
          Guarda las claves en el servidor de tu integración. Una clave en código de navegador o en una aplicación móvil
          puede extraerse y usarse con todos sus permisos.
        </Note>
      </>
    );
  }

  return (
    <>
      <H1>Authentication</H1>
      <Lead>Every request is authenticated with an API key of the workspace, sent as a bearer token.</Lead>
      <CodeBlock code={HEADER} label="HTTP" className="mb-6" />

      <H2>What a key can do</H2>
      <UL>
        <li>
          A key belongs to the workspace it was created in. Every request acts on that workspace only; there is no workspace
          slug in the URL.
        </li>
        <li>
          A key acts with the <strong>workspace role of the user who created it</strong>.{" "}
          <DocLink to={DOCS_ROUTES.guide("scopes")}>Scopes</DocLink> narrow what the key can call, and the creator's role still
          decides what it may do: a key created by an agent cannot delete tickets even with <C>tickets:write</C>.
        </li>
        <li>Keys are only accepted on <C>/api/v1</C>. Sent to any other endpoint they are refused with <C>401</C>.</li>
      </UL>

      <H2>When a key stops working</H2>
      <Table
        head={["Situation", "Response"]}
        rows={[
          ["No Authorization header", <C>401</C>],
          ["The key expired", <C>401</C>],
          ["The user who created the key is deactivated", <C>401</C>],
          [<>The key is unknown or revoked (<C>"Forbidden resource"</C>)</>, <C>403</C>],
          [<>The key lacks the operation's scope (<C>"Insufficient API key permissions"</C>)</>, <C>403</C>],
          ["The creator's role does not allow the action", <C>403</C>],
        ]}
      />
      <P>
        When a key's creator is deactivated, their keys stop working. If the user is reactivated, the keys work again unless
        they expired or were revoked.
      </P>
      <Note tone="warning">
        Keep keys on your integration's server. A key in browser code or in a mobile app can be extracted and used with all
        its scopes.
      </Note>
    </>
  );
}
