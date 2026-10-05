import { C, H1, H2, Lead, Note, P, Table } from "../components/prose";
import type { GuideProps } from "./guide-types";

/** Mirrors the throttler settings of the backend (100 requests per 60 seconds). */
export const RATE_LIMIT = { limit: 100, windowSeconds: 60 };

export default function RateLimitsGuide({ lang }: GuideProps) {
  const { limit, windowSeconds } = RATE_LIMIT;

  if (lang === "es") {
    return (
      <>
        <H1>Límites de peticiones</H1>
        <Lead>
          Cada endpoint admite <strong>{limit} peticiones cada {windowSeconds} segundos por dirección IP</strong> del cliente.
        </Lead>
        <P>
          El contador es por endpoint (listar tickets y crear un ticket cuentan por separado) y se guarda en la memoria del
          proceso del servidor.
        </P>

        <H2>Cabeceras</H2>
        <Table
          head={["Cabecera", "Significado"]}
          rows={[
            [<C>X-RateLimit-Limit</C>, "Peticiones permitidas en la ventana."],
            [<C>X-RateLimit-Remaining</C>, "Peticiones que quedan en la ventana actual."],
            [<C>X-RateLimit-Reset</C>, "Segundos hasta que la ventana se reinicia."],
            [<C>Retry-After</C>, <>Solo en respuestas <C>429</C>: segundos que hay que esperar.</>],
          ]}
        />

        <H2>Al superar el límite</H2>
        <P>
          La API responde <C>429</C> con <C>Retry-After</C>. Espera ese número de segundos antes de reintentar, y reparte las
          peticiones en lugar de enviarlas en ráfagas.
        </P>
        <Note>
          Si el servidor está detrás de un proxy inverso, la dirección que ve puede ser la del proxy; en ese caso todos los
          clientes detrás de él comparten un mismo contador.
        </Note>
      </>
    );
  }

  return (
    <>
      <H1>Rate limits</H1>
      <Lead>
        Each endpoint allows <strong>{limit} requests per {windowSeconds} seconds per client IP address</strong>.
      </Lead>
      <P>
        The counter is kept per endpoint (listing tickets and creating a ticket count separately) and in the memory of the
        server process.
      </P>

      <H2>Headers</H2>
      <Table
        head={["Header", "Meaning"]}
        rows={[
          [<C>X-RateLimit-Limit</C>, "Requests allowed in the window."],
          [<C>X-RateLimit-Remaining</C>, "Requests left in the current window."],
          [<C>X-RateLimit-Reset</C>, "Seconds until the window resets."],
          [<C>Retry-After</C>, <>On <C>429</C> responses only: seconds to wait.</>],
        ]}
      />

      <H2>Past the limit</H2>
      <P>
        The API answers <C>429</C> with <C>Retry-After</C>. Wait that many seconds before retrying, and spread requests out
        instead of sending them in bursts.
      </P>
      <Note>
        If the server runs behind a reverse proxy, the address it sees may be the proxy's, in which case all clients behind it
        share one counter.
      </Note>
    </>
  );
}
