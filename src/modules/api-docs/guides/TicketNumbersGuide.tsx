import { C, H1, H2, Lead, P, UL } from "../components/prose";
import type { GuideProps } from "./guide-types";

export default function TicketNumbersGuide({ lang }: GuideProps) {
  if (lang === "es") {
    return (
      <>
        <H1>Números de ticket</H1>
        <Lead>
          Cada ticket tiene un <C>id</C> ULID, que se usa en las URLs, y un <C>ticketNumber</C> para las personas, con el
          formato <C>TK-000042</C>.
        </Lead>
        <UL>
          <li>El prefijo <C>TK-</C> y un contador de al menos seis dígitos, único y sin huecos dentro del espacio de trabajo.</li>
          <li>
            A partir de 999999 crece a más dígitos (<C>TK-1000000</C>) en lugar de volver a empezar, así que no lo trates
            como un valor de ancho fijo.
          </li>
          <li>Los endpoints que reciben un ticket por la ruta esperan el <C>id</C>, no el número.</li>
        </UL>

        <H2>Buscar por número</H2>
        <P>
          El filtro <C>search</C> de <C>GET /api/v1/tickets</C> acepta un número de ticket en cualquiera de las formas{" "}
          <C>TK-000042</C>, <C>tk-42</C> o <C>42</C>. Úsalo para pasar de un número que te da una persona al <C>id</C> del
          ticket.
        </P>
      </>
    );
  }

  return (
    <>
      <H1>Ticket numbers</H1>
      <Lead>
        Every ticket has a ULID <C>id</C>, used in URLs, and a <C>ticketNumber</C> shown to people, formatted as{" "}
        <C>TK-000042</C>.
      </Lead>
      <UL>
        <li>The prefix <C>TK-</C> and a counter of at least six digits, unique and gap-free within the workspace.</li>
        <li>
          Past 999999 it grows to more digits (<C>TK-1000000</C>) instead of wrapping, so do not parse it as fixed width.
        </li>
        <li>Endpoints that take a ticket in the path expect the <C>id</C>, not the number.</li>
      </UL>

      <H2>Finding a ticket by number</H2>
      <P>
        The <C>search</C> filter of <C>GET /api/v1/tickets</C> accepts a ticket number in any of the forms <C>TK-000042</C>,{" "}
        <C>tk-42</C> or <C>42</C>. Use it to go from a number a person gives you to the ticket's <C>id</C>.
      </P>
    </>
  );
}
