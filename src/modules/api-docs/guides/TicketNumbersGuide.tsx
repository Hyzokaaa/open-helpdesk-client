import { C, H1, H2, Lead, P, UL } from "../components/prose";
import type { GuideProps } from "./guide-types";

export default function TicketNumbersGuide({ lang }: GuideProps) {
  if (lang === "es") {
    return (
      <>
        <H1>Referencias de ticket</H1>
        <Lead>
          Cada ticket tiene un <C>id</C> ULID, que se usa en las URLs, y un <C>ticketNumber</C> para las personas. Trata{" "}
          <C>ticketNumber</C> como un texto opaco: sirve para mostrarlo y para buscar, no para interpretarlo.
        </Lead>
        <P>Cada espacio de trabajo elige el formato de sus referencias y su prefijo (por defecto <C>TK</C>):</P>
        <UL>
          <li>
            <strong>Secuencial</strong> (el de siempre): <C>TK-000042</C>, el prefijo y un contador de al menos seis dígitos.
            A partir de 999999 crece (<C>TK-1000000</C>), así que no lo trates como un valor de ancho fijo.
          </li>
          <li>
            <strong>Aleatoria</strong>: <C>TK-7QX4M2K</C>, siete caracteres que no revelan cuántos tickets hay ni su orden.
            El último es un carácter de control que detecta errores al escribirla.
          </li>
          <li>El formato y el prefijo pueden cambiar con el tiempo: no guardes la referencia como identificador, guarda el <C>id</C>.</li>
          <li>Los endpoints que reciben un ticket por la ruta esperan el <C>id</C>, no la referencia.</li>
        </UL>

        <H2>Buscar por referencia</H2>
        <P>
          El filtro <C>search</C> de <C>GET /api/v1/tickets</C> acepta la referencia en el formato del espacio de trabajo,
          con o sin prefijo y sin distinguir mayúsculas, y también la referencia secuencial (<C>TK-000042</C>, <C>42</C>), así
          que las referencias de antes de un cambio de formato se siguen encontrando. Úsalo para pasar de una referencia que
          te da una persona al <C>id</C> del ticket.
        </P>
      </>
    );
  }

  return (
    <>
      <H1>Ticket references</H1>
      <Lead>
        Every ticket has a ULID <C>id</C>, used in URLs, and a <C>ticketNumber</C> shown to people. Treat{" "}
        <C>ticketNumber</C> as opaque text: it is for showing and searching, not for parsing.
      </Lead>
      <P>Each workspace chooses the format of its references and their prefix (<C>TK</C> by default):</P>
      <UL>
        <li>
          <strong>Sequential</strong> (the default): <C>TK-000042</C>, the prefix and a counter of at least six digits.
          Past 999999 it grows (<C>TK-1000000</C>), so do not parse it as fixed width.
        </li>
        <li>
          <strong>Random</strong>: <C>TK-7QX4M2K</C>, seven characters that reveal neither how many tickets there are nor
          their order. The last one is a check character that catches typing mistakes.
        </li>
        <li>The format and the prefix can change over time: do not store the reference as an identifier, store the <C>id</C>.</li>
        <li>Endpoints that take a ticket in the path expect the <C>id</C>, not the reference.</li>
      </UL>

      <H2>Finding a ticket by reference</H2>
      <P>
        The <C>search</C> filter of <C>GET /api/v1/tickets</C> accepts the reference in the workspace's format, with or
        without its prefix and in any case, and also the sequential reference (<C>TK-000042</C>, <C>42</C>), so references
        from before a format change are still found. Use it to go from a reference a person gives you to the ticket's{" "}
        <C>id</C>.
      </P>
    </>
  );
}
