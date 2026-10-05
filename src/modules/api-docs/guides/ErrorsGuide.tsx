import CodeBlock from "../components/CodeBlock";
import { C, H1, H2, Lead, P, Table } from "../components/prose";
import type { GuideProps } from "./guide-types";

const NOT_FOUND = `{ "statusCode": 404, "message": "Ticket not found", "error": "EntityNotFoundError" }`;

const VALIDATION = `{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "priority must be one of the following values: low, medium, high, critical"
  ],
  "error": "Bad Request"
}`;

export default function ErrorsGuide({ lang }: GuideProps) {
  if (lang === "es") {
    return (
      <>
        <H1>Errores</H1>
        <Lead>
          Los errores son JSON con el estado HTTP repetido en <C>statusCode</C>, un <C>message</C> legible y, normalmente,
          una etiqueta <C>error</C>.
        </Lead>
        <CodeBlock code={NOT_FOUND} label="JSON" className="mb-4" />
        <P>Los fallos de validación devuelven <C>400</C> con <C>message</C> como lista:</P>
        <CodeBlock code={VALIDATION} label="JSON" className="mb-4" />
        <P>
          Los textos de <C>message</C> están pensados para personas y pueden cambiar; decide en tu código a partir de{" "}
          <C>statusCode</C> y <C>error</C>.
        </P>

        <H2>Códigos de estado</H2>
        <Table
          head={["Estado", "Cuándo"]}
          rows={[
            [<C>400</C>, <>El cuerpo o la consulta no pasaron la validación, o una regla de negocio rechazó el cambio (<C>error: "DomainValidationError"</C>), como una transición de estado que el flujo no permite. Las propiedades desconocidas del cuerpo se ignoran, no se rechazan.</>],
            [<C>401</C>, <>Falta la cabecera <C>Authorization</C>, la clave caducó o su creador está desactivado.</>],
            [<C>403</C>, <>La clave no existe o fue revocada (<C>"Forbidden resource"</C>), no tiene el permiso de la operación (<C>"Insufficient API key permissions"</C>) o el rol del creador no permite la acción (<C>error: "AccessDeniedError"</C>).</>],
            [<C>404</C>, "El ticket no existe en el espacio de la clave. Los tickets de otros espacios se tratan como inexistentes."],
            [<C>429</C>, <>Se superó el límite de peticiones (<C>"ThrottlerException: Too Many Requests"</C>).</>],
          ]}
        />
      </>
    );
  }

  return (
    <>
      <H1>Errors</H1>
      <Lead>
        Errors are JSON with the HTTP status repeated in <C>statusCode</C>, a human-readable <C>message</C> and, usually, an{" "}
        <C>error</C> label.
      </Lead>
      <CodeBlock code={NOT_FOUND} label="JSON" className="mb-4" />
      <P>Request validation failures return <C>400</C> with <C>message</C> as a list:</P>
      <CodeBlock code={VALIDATION} label="JSON" className="mb-4" />
      <P>
        <C>message</C> texts are meant for people and may change; branch in your code on <C>statusCode</C> and <C>error</C>.
      </P>

      <H2>Status codes</H2>
      <Table
        head={["Status", "When"]}
        rows={[
          [<C>400</C>, <>The body or query failed validation, or a business rule rejected the change (<C>error: "DomainValidationError"</C>), such as a status transition the workflow does not allow. Unknown body properties are ignored, not rejected.</>],
          [<C>401</C>, <>No <C>Authorization</C> header, the key expired, or its creator is deactivated.</>],
          [<C>403</C>, <>The key is unknown or revoked (<C>"Forbidden resource"</C>), it lacks the operation's scope (<C>"Insufficient API key permissions"</C>), or the creator's role does not allow the action (<C>error: "AccessDeniedError"</C>).</>],
          [<C>404</C>, "The ticket does not exist in the key's workspace. Tickets of other workspaces are reported as not found."],
          [<C>429</C>, <>Rate limit exceeded (<C>"ThrottlerException: Too Many Requests"</C>).</>],
        ]}
      />
    </>
  );
}
