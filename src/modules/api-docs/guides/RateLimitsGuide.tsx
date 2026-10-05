import { C, H1, H2, Lead, Note, P, Table } from "../components/prose";
import { renderInline } from "../components/RichText";
import { rateLimit } from "../domain/extensions";
import { rateLimitSentences } from "../domain/guide-facts";
import type { DocsLang, GuideProps } from "./guide-types";

/** Spanish wording of the header descriptions, keyed by header name; others fall back to the document. */
const HEADER_DESCRIPTIONS_ES: Record<string, string> = {
  "X-RateLimit-Limit": "Peticiones permitidas en la ventana.",
  "X-RateLimit-Remaining": "Peticiones que quedan en la ventana actual.",
  "X-RateLimit-Reset": "Segundos hasta que la ventana se reinicia.",
  "Retry-After": "Solo en respuestas `429`: segundos que hay que esperar antes de reintentar.",
};

const TEXT: Record<DocsLang, Record<string, string>> = {
  en: {
    title: "Rate limits",
    loading: "The limits appear once the API document has loaded.",
    unavailable: "The limits come from the API document, which could not be loaded. Reload the page to see them.",
    headers: "Headers",
    header: "Header",
    meaning: "Meaning",
    exceeded: "Past the limit",
  },
  es: {
    title: "Límites de peticiones",
    loading: "Los límites aparecen cuando se carga el documento de la API.",
    unavailable: "Los límites vienen del documento de la API, que no se pudo cargar. Recarga la página para verlos.",
    headers: "Cabeceras",
    header: "Cabecera",
    meaning: "Significado",
    exceeded: "Al superar el límite",
  },
};


export default function RateLimitsGuide({ lang, document, documentStatus }: GuideProps) {
  const text = TEXT[lang];
  const limit = document ? rateLimit(document) : null;

  if (!limit) {
    return (
      <>
        <H1>{text.title}</H1>
        {documentStatus === "loading" ? <P className="text-muted">{text.loading}</P> : <Note tone="warning">{text.unavailable}</Note>}
      </>
    );
  }

  const { lead, details, proxyNote } = rateLimitSentences(limit, lang);
  const status = limit.exceededStatus ?? 429;

  return (
    <>
      <H1>{text.title}</H1>
      <Lead>{renderInline(lead)}</Lead>
      {details.map((d) => <P key={d}>{d}</P>)}

      {limit.headers && limit.headers.length > 0 && (
        <>
          <H2>{text.headers}</H2>
          <Table
            head={[text.header, text.meaning]}
            rows={limit.headers.map((h) => [
              <C>{h.name}</C>,
              renderInline((lang === "es" && HEADER_DESCRIPTIONS_ES[h.name]) || h.description || ""),
            ])}
          />
        </>
      )}

      <H2>{text.exceeded}</H2>
      {lang === "es" ? (
        <P>
          La API responde <C>{status}</C> con <C>Retry-After</C>. Espera ese número de segundos antes de reintentar, y reparte
          las peticiones en lugar de enviarlas en ráfagas.
        </P>
      ) : (
        <P>
          The API answers <C>{status}</C> with <C>Retry-After</C>. Wait that many seconds before retrying, and spread requests
          out instead of sending them in bursts.
        </P>
      )}
      {proxyNote && <Note>{proxyNote}</Note>}
    </>
  );
}
