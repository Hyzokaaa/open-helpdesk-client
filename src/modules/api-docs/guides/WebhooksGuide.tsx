import CodeBlock from "../components/CodeBlock";
import FieldTable from "../components/FieldTable";
import { renderInline } from "../components/RichText";
import { C, H1, H2, H3, Lead, Note, P, Table, UL } from "../components/prose";
import { documentWebhooks, signatureHeader, webhookDelivery } from "../domain/extensions";
import { deliveryFacts, verificationExample } from "../domain/guide-facts";
import type { DocsLang, GuideProps } from "./guide-types";

/**
 * Spanish wording of the event descriptions. The events, their payloads and the English text
 * come from the API document (x-webhooks); an event missing here falls back to the document.
 */
const EVENT_DESCRIPTIONS_ES: Record<string, string> = {
  "ticket.created": "Se abrió un ticket: en la aplicación, por la API pública, desde el portal público o por un correo entrante.",
  "ticket.updated":
    "Se editaron campos de un ticket (título, descripción, prioridad, categoría, etiquetas, departamento, organización, proyecto, campos personalizados), en la aplicación o por la API pública. Solo se envía si algo cambió; los cambios de estado y de asignado tienen sus propios eventos.",
  "ticket.statusChanged": "Un ticket cambió de estado, en la aplicación o por la API pública. Fíjate en el nombre en camelCase.",
  "ticket.assigned": "Un ticket se asignó, reasignó o desasignó, en la aplicación o por la API pública.",
  "ticket.deleted": "Se eliminó un ticket, uno a uno o en bloque en la aplicación, o por la API pública.",
  "comment.created": "Se añadió un comentario a un ticket: en la aplicación, por la API pública, desde el portal público o como respuesta por correo.",
};

/** Spanish wording of the header descriptions, keyed by header name; others fall back to the document. */
const HEADER_DESCRIPTIONS_ES: Record<string, string> = {
  "Content-Type": "Siempre JSON.",
  "X-Webhook-Event": "El nombre del evento, igual que `event` en el cuerpo.",
  "X-Webhook-Signature": "HMAC-SHA256 del cuerpo exacto de la petición con el secreto del webhook como clave, en hexadecimal y sin prefijo.",
};

const TEXT: Record<DocsLang, Record<string, string>> = {
  en: {
    lead: "Members who manage the workspace settings configure webhooks in **Settings → Webhooks** with a URL, the events to receive and a secret. For each event the server sends a request with a JSON body `{ event, data, timestamp }`.",
    loading: "The events and delivery details appear once the API document has loaded.",
    unavailable:
      "The events, their payloads and the delivery details come from the API document, which could not be loaded. Reload the page to see them.",
    delivery: "Delivery",
    headers: "Headers",
    header: "Header",
    value: "Value",
    events: "Events",
    eventsIntro: "Fields marked required are always present. Ignore fields you do not know; new ones may be added.",
    notSent: "Not sent yet",
    notSentNote: "Can be selected on a webhook, but the server does not send it yet.",
    body: "Body",
    example: "Example",
    verify: "Verifying the signature",
    verifyIntro: "Verify the signature against the raw body, before parsing it, with a constant-time comparison. Node.js with Express:",
    replay: "The signature does not cover a timestamp header; check `timestamp` in the body to reject old replays.",
  },
  es: {
    lead: "Los miembros que gestionan los ajustes del espacio configuran webhooks en **Ajustes → Webhooks** con una URL, los eventos que quieren recibir y un secreto. Por cada evento, el servidor envía una petición con un cuerpo JSON `{ event, data, timestamp }`.",
    loading: "Los eventos y los detalles de entrega aparecen cuando se carga el documento de la API.",
    unavailable:
      "Los eventos, sus contenidos y los detalles de entrega vienen del documento de la API, que no se pudo cargar. Recarga la página para verlos.",
    delivery: "Entrega",
    headers: "Cabeceras",
    header: "Cabecera",
    value: "Valor",
    events: "Eventos",
    eventsIntro: "Los campos marcados como obligatorios siempre están presentes. Ignora los campos que no conozcas; pueden añadirse otros nuevos.",
    notSent: "Aún no se envía",
    notSentNote: "Se puede seleccionar en un webhook, pero el servidor todavía no lo envía.",
    body: "Cuerpo",
    example: "Ejemplo",
    verify: "Verificar la firma",
    verifyIntro: "Verifica la firma sobre el cuerpo sin procesar, antes de interpretarlo, con una comparación de tiempo constante. Ejemplo en Node.js con Express:",
    replay: "La firma no cubre ninguna cabecera de fecha; comprueba `timestamp` en el cuerpo para rechazar repeticiones antiguas.",
  },
};


export default function WebhooksGuide({ lang, document, documentStatus }: GuideProps) {
  const text = TEXT[lang];
  const delivery = document ? webhookDelivery(document) : null;
  const events = document ? documentWebhooks(document) : [];
  const header = signatureHeader(delivery);

  const intro = (
    <>
      <H1>Webhooks</H1>
      <Lead>{renderInline(text.lead)}</Lead>
    </>
  );

  if (documentStatus === "loading") {
    return (
      <>
        {intro}
        <P className="text-muted">{text.loading}</P>
      </>
    );
  }

  if (!delivery || events.length === 0) {
    return (
      <>
        {intro}
        <Note tone="warning">{text.unavailable}</Note>
      </>
    );
  }

  return (
    <>
      {intro}

      <H2 id="delivery">{text.delivery}</H2>
      <UL>
        {deliveryFacts(delivery, lang).map((fact) => <li key={fact}>{renderInline(fact)}</li>)}
      </UL>

      {delivery.headers && delivery.headers.length > 0 && (
        <>
          <H3>{text.headers}</H3>
          <Table
            head={[text.header, text.value]}
            rows={delivery.headers.map((h) => [
              <C>{h.name}</C>,
              renderInline((lang === "es" && HEADER_DESCRIPTIONS_ES[h.name]) || h.description || h.value || ""),
            ])}
          />
        </>
      )}

      <H2 id="events">{text.events}</H2>
      <P>{text.eventsIntro}</P>
      {events.map((e) => (
        <section key={e.event} id={`event-${e.event}`} className="mb-8 scroll-mt-20">
          <div className="flex items-center flex-wrap gap-2 mt-6 mb-2">
            <h3 className="font-mono text-base text-heading">{e.event}</h3>
            {!e.delivered && (
              <span className="rounded px-1.5 py-px text-xs font-body-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {text.notSent}
              </span>
            )}
          </div>
          <P>
            {renderInline(e.delivered ? (lang === "es" && EVENT_DESCRIPTIONS_ES[e.event]) || e.description || e.summary || "" : text.notSentNote)}
          </P>
          {e.delivered && (
            <>
              <FieldTable fields={e.fields} />
              {e.example !== undefined && (
                <CodeBlock code={JSON.stringify(e.example, null, 2)} label={`${text.example} · JSON`} className="mb-4" />
              )}
            </>
          )}
        </section>
      ))}

      {header && (
        <>
          <H2 id="verify">{text.verify}</H2>
          <P>{text.verifyIntro}</P>
          <CodeBlock code={verificationExample(header)} label="Node.js" className="mb-4" />
          <Note>{renderInline(text.replay)}</Note>
        </>
      )}
    </>
  );
}
