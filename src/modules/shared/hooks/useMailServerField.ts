import { useEffect, useRef, useState } from "react";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  emailDomain,
  shouldApplySuggestion,
  suggestionFor,
  type MailServerKind,
  type ResolvedServers,
  type SuggestedServer,
} from "../domain/mail-server-suggestion";

interface Props {
  /** The address whose domain the server follows: the SMTP login, or the mailbox address */
  address: string;
  kind: MailServerKind;
  /** Asks the backend for the domain's servers (workspace or installation endpoint) */
  resolve: (domain: string) => Promise<ResolvedServers>;
  /** What is saved, when editing */
  saved?: { address?: string | null; host?: string | null; port?: number | null };
}

/**
 * The host and port fields of a mail server form. They follow the domain of the address: a new
 * domain brings its servers (found in its DNS, or the usual name as a guess), unless the person
 * typed the host. The note says where the suggestion came from.
 */
export default function useMailServerField({ address, kind, resolve, saved }: Props) {
  const { t } = useTranslation();
  const defaultPort = kind === "smtp" ? 587 : 993;
  const [host, setHostValue] = useState(saved?.host ?? "");
  const [port, setPort] = useState(String(saved?.port ?? defaultPort));
  const [hostTyped, setHostTyped] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestedServer | null>(null);
  // The domain whose host the field holds; a saved host belongs to the saved address's domain
  const appliedDomain = useRef(emailDomain(saved?.address ?? ""));
  // Suggestions arrive later: read what the field holds now, not a stale closure
  const hostRef = useRef(host);
  hostRef.current = host;
  const typedRef = useRef(hostTyped);
  typedRef.current = hostTyped;

  const domain = emailDomain(address);

  useEffect(() => {
    if (!domain) return;
    let live = true;
    const timer = setTimeout(() => {
      resolve(domain)
        .catch((): ResolvedServers => ({}))
        .then((found) => { if (live) setSuggestion(suggestionFor(kind, domain, found)); });
    }, 500);
    return () => { live = false; clearTimeout(timer); };
  }, [domain]);

  useEffect(() => {
    if (!suggestion) return;
    if (!shouldApplySuggestion({ suggestion, appliedDomain: appliedDomain.current, hostTyped: typedRef.current, currentHost: hostRef.current })) return;
    setHostValue(suggestion.host);
    setPort(String(suggestion.port));
    appliedDomain.current = suggestion.domain;
  }, [suggestion]);

  /** Typed by the person: kept from then on; emptied, the suggestions take over again */
  const setHost = (value: string) => {
    setHostTyped(value.trim() !== "");
    setHostValue(value);
  };

  const showsSuggestion = !hostTyped && !!suggestion && host === suggestion.host;
  const note = !showsSuggestion || !suggestion
    ? null
    : suggestion.source === "guess"
      ? t("mailServer.guess").replace("{domain}", suggestion.domain)
      : suggestion.source === "provider"
        ? t("mailServer.provider").replace("{domain}", suggestion.domain)
        : t("mailServer.foundInDns").replace("{domain}", suggestion.domain);

  return { host, setHost, port, setPort, note };
}
