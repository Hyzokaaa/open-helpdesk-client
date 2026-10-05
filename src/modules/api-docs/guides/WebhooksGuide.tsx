import CodeBlock from "../components/CodeBlock";
import { C, H1, H2, Lead, Note, P, Table, UL } from "../components/prose";
import type { DocsLang, GuideProps } from "./guide-types";

/** Mirrors WebhookEvent and the events WebhookDeliveryService delivers in the backend. */
const EVENTS: { event: string; delivered: boolean; en: string; es: string }[] = [
  { event: "ticket.created", delivered: true, en: "A ticket was opened, from any source.", es: "Se abrió un ticket, desde cualquier origen." },
  { event: "ticket.statusChanged", delivered: true, en: "A ticket moved to another status. Note the camelCase name.", es: "Un ticket cambió de estado. Fíjate en el nombre en camelCase." },
  { event: "ticket.assigned", delivered: true, en: "A ticket was assigned, reassigned or unassigned.", es: "Un ticket se asignó, reasignó o desasignó." },
  { event: "comment.created", delivered: true, en: "A comment was added to a ticket.", es: "Se añadió un comentario a un ticket." },
  { event: "ticket.updated", delivered: false, en: "Selectable, not delivered yet.", es: "Seleccionable, todavía no se envía." },
  { event: "ticket.deleted", delivered: false, en: "Selectable, not delivered yet.", es: "Seleccionable, todavía no se envía." },
];

const PAYLOAD = `{
  "event": "ticket.created",
  "data": {
    "ticketId": "01JABCDEF0123456789ABCDEFG",
    "ticketName": "Cannot log in",
    "workspaceId": "01JWORKSPACE0123456789ABCD",
    "workspaceSlug": "acme",
    "...": "..."
  },
  "timestamp": "2026-10-05T12:00:00.000Z"
}`;

const VERIFY = `const crypto = require('crypto');
const express = require('express');

function isValidSignature(rawBody, signatureHeader, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(String(signatureHeader || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const app = express();

// Keep the raw body for this route: the signature covers the exact bytes sent
app.post('/hooks/helpdesk', express.raw({ type: 'application/json' }), (req, res) => {
  if (!isValidSignature(req.body, req.get('X-Webhook-Signature'), process.env.WEBHOOK_SECRET)) {
    return res.sendStatus(401);
  }
  const { event, data } = JSON.parse(req.body.toString('utf8'));
  res.sendStatus(204);
  // handle the event asynchronously...
});`;

const TEXT: Record<DocsLang, Record<string, string>> = {
  en: { event: "Event", delivered: "Delivered", meaning: "Meaning", yes: "yes", no: "no", header: "Header", value: "Value" },
  es: { event: "Evento", delivered: "Se envía", meaning: "Significado", yes: "sí", no: "no", header: "Cabecera", value: "Valor" },
};

export default function WebhooksGuide({ lang }: GuideProps) {
  const text = TEXT[lang];
  const eventsTable = (
    <Table
      head={[text.event, text.delivered, text.meaning]}
      rows={EVENTS.map((e) => [<C>{e.event}</C>, e.delivered ? text.yes : text.no, e[lang]])}
    />
  );

  if (lang === "es") {
    return (
      <>
        <H1>Webhooks</H1>
        <Lead>
          Los miembros que gestionan los ajustes del espacio configuran webhooks en <strong>Ajustes → Webhooks</strong> con
          una URL, los eventos que quieren recibir y un secreto. Por cada evento, el servidor envía un <C>POST</C> con un
          cuerpo JSON.
        </Lead>
        <CodeBlock code={PAYLOAD} label="JSON" className="mb-4" />
        <P>
          <C>data</C> es el contenido del evento: siempre incluye <C>workspaceId</C> y, en estos eventos, <C>ticketId</C> y{" "}
          <C>ticketName</C>, además de campos propios de cada evento como <C>oldStatus</C>/<C>newStatus</C>,{" "}
          <C>newAssigneeId</C>/<C>previousAssigneeId</C> o <C>commentId</C>/<C>authorId</C>/<C>commentContent</C>. Ignora
          los campos que no conozcas; pueden añadirse otros nuevos.
        </P>

        <H2>Eventos</H2>
        {eventsTable}

        <H2>Cabeceras</H2>
        <Table
          head={[text.header, text.value]}
          rows={[
            [<C>X-Webhook-Event</C>, "El nombre del evento."],
            [<C>X-Webhook-Signature</C>, "HMAC-SHA256 del cuerpo exacto de la petición con el secreto del webhook como clave, en hexadecimal."],
          ]}
        />

        <H2>Entrega</H2>
        <UL>
          <li>Se intenta una sola vez, con un tiempo límite de 10 segundos y sin reintentos.</li>
          <li>Responde enseguida con un <C>2xx</C> y haz el trabajo de forma asíncrona.</li>
        </UL>

        <H2>Verificar la firma</H2>
        <P>
          Verifica la firma sobre el cuerpo sin procesar, antes de interpretarlo, con una comparación de tiempo constante.
          Ejemplo en Node.js con Express:
        </P>
        <CodeBlock code={VERIFY} label="Node.js" className="mb-4" />
        <Note>
          La firma no cubre ninguna cabecera de fecha; comprueba <C>timestamp</C> en el cuerpo para rechazar repeticiones
          antiguas.
        </Note>
      </>
    );
  }

  return (
    <>
      <H1>Webhooks</H1>
      <Lead>
        Members who manage the workspace settings configure webhooks in <strong>Settings → Webhooks</strong> with a URL, the
        events to receive and a secret. For each event the server sends a <C>POST</C> with a JSON body.
      </Lead>
      <CodeBlock code={PAYLOAD} label="JSON" className="mb-4" />
      <P>
        <C>data</C> is the event payload: it always includes <C>workspaceId</C> and, for these events, <C>ticketId</C> and{" "}
        <C>ticketName</C>, plus event-specific fields such as <C>oldStatus</C>/<C>newStatus</C>,{" "}
        <C>newAssigneeId</C>/<C>previousAssigneeId</C> or <C>commentId</C>/<C>authorId</C>/<C>commentContent</C>. Ignore
        fields you do not know; new ones may be added.
      </P>

      <H2>Events</H2>
      {eventsTable}

      <H2>Headers</H2>
      <Table
        head={[text.header, text.value]}
        rows={[
          [<C>X-Webhook-Event</C>, "The event name."],
          [<C>X-Webhook-Signature</C>, "The HMAC-SHA256 of the raw request body keyed with the webhook secret, hex-encoded."],
        ]}
      />

      <H2>Delivery</H2>
      <UL>
        <li>Delivery is attempted once, with a 10 second timeout and no retries.</li>
        <li>Respond with a <C>2xx</C> quickly and do the work asynchronously.</li>
      </UL>

      <H2>Verifying the signature</H2>
      <P>
        Verify the signature against the raw body, before parsing it, with a constant-time comparison. Node.js with Express:
      </P>
      <CodeBlock code={VERIFY} label="Node.js" className="mb-4" />
      <Note>
        The signature does not cover a timestamp header; check <C>timestamp</C> in the body to reject old replays.
      </Note>
    </>
  );
}
