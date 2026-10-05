import type { DocsLang } from "../guides/guide-types";
import type { RateLimit, WebhookDelivery } from "./openapi.types";
import { formatMilliseconds } from "./extensions";

/*
 * Sentences of the Webhooks and Rate limits guides, built from the structured facts of the API
 * document so both languages state the same numbers the server enforces.
 */

/** The hand-written verification example, with the signature header the document names. */
export function verificationExample(header: string): string {
  return `const crypto = require('crypto');
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
  if (!isValidSignature(req.body, req.get('${header}'), process.env.WEBHOOK_SECRET)) {
    return res.sendStatus(401);
  }
  const { event, data } = JSON.parse(req.body.toString('utf8'));
  res.sendStatus(204);
  // handle the event asynchronously...
});`;
}

/** Delivery facts as sentences, built from the structured fields so both languages state the same numbers. */
export function deliveryFacts(delivery: WebhookDelivery, lang: DocsLang): string[] {
  const facts: string[] = [];
  const es = lang === "es";
  const method = delivery.method ?? "POST";
  if (delivery.attempts !== undefined || delivery.timeoutMs !== undefined) {
    const attempts = delivery.attempts ?? 1;
    const retries = delivery.retries ?? Math.max(0, attempts - 1);
    const timeout = delivery.timeoutMs !== undefined ? formatMilliseconds(delivery.timeoutMs) : null;
    if (es) {
      facts.push(
        `Cada entrega es un \`${method}\` que se intenta ${attempts === 1 ? "una sola vez" : `${attempts} veces`}` +
          (timeout ? `, con un tiempo límite de ${timeout}` : "") +
          (retries === 0 ? " y sin reintentos." : `, con ${retries} reintentos.`),
      );
    } else {
      facts.push(
        `Each delivery is a \`${method}\` attempted ${attempts === 1 ? "once" : `${attempts} times`}` +
          (timeout ? `, with a ${timeout} timeout` : "") +
          (retries === 0 ? " and no retries." : `, with ${retries} retries.`),
      );
    }
  }
  if (delivery.successStatus) {
    facts.push(
      es
        ? `Cualquier respuesta \`${delivery.successStatus}\` cuenta como entregada. Otro estado, un error de red o el tiempo límite solo quedan en el registro del servidor${delivery.retries === 0 ? ": esa entrega se pierde" : ""}.`
        : `Any \`${delivery.successStatus}\` response counts as delivered. Another status, a network error or the timeout is only logged on the server${delivery.retries === 0 ? ": that delivery is lost" : ""}.`,
    );
  }
  if (delivery.redirects === "followed") {
    facts.push(es ? "Las redirecciones se siguen." : "Redirects are followed.");
  }
  facts.push(
    es
      ? "Solo reciben el evento los webhooks activos del espacio donde ocurrió que lo tengan seleccionado; cada uno recibe su propia petición, sin orden garantizado entre eventos."
      : "Only active webhooks of the workspace where the event happened that selected it receive it; each gets its own request, with no ordering guarantee between events.",
  );
  facts.push(es ? "Responde enseguida con un `2xx` y haz el trabajo de forma asíncrona." : "Respond with a `2xx` quickly and do the work asynchronously.");
  return facts;
}

/** The lead sentence and the details, from the structured fields of x-rate-limit. */
export function rateLimitSentences(limit: RateLimit, lang: DocsLang): { lead: string; details: string[]; proxyNote: string | null } {
  const es = lang === "es";
  const perIp = limit.tracker === "ip" || limit.scope?.startsWith("ip");
  const lead = es
    ? `Cada endpoint admite **${limit.limit} peticiones cada ${limit.windowSeconds} segundos${perIp ? " por dirección IP del cliente" : ""}**.`
    : `Each endpoint allows **${limit.limit} requests per ${limit.windowSeconds} seconds${perIp ? " per client IP address" : ""}**.`;

  const details: string[] = [];
  if (limit.perEndpoint) {
    details.push(
      es
        ? "El contador es por endpoint: listar tickets y crear un ticket cuentan por separado. Las peticiones rechazadas también cuentan."
        : "The counter is kept per endpoint: listing tickets and creating a ticket count separately. Rejected requests count too.",
    );
  }
  if (limit.storage === "memory") {
    details.push(
      es
        ? "Los contadores viven en la memoria de cada proceso del servidor: se reinician al reiniciarlo y no se comparten entre instancias."
        : "Counters live in the memory of each server process: they reset on restart and are not shared between instances.",
    );
  }
  const proxyNote = perIp
    ? es
      ? "Si el servidor está detrás de un proxy inverso, la dirección que ve puede ser la del proxy; en ese caso todos los clientes detrás de él comparten un mismo contador."
      : "If the server runs behind a reverse proxy, the address it sees may be the proxy's, in which case all clients behind it share one counter."
    : null;
  return { lead, details, proxyNote };
}
