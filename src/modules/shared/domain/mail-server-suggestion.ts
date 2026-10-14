/** Where a suggested server came from; "guess" is the usual name when nothing else was found. */
export type MailServerSource = "srv" | "provider" | "mx" | "host" | "guess";

export interface SuggestedServer {
  domain: string;
  host: string;
  port: number;
  source: MailServerSource;
}

export interface ResolvedServers {
  smtp?: { host: string; port: number; source: Exclude<MailServerSource, "guess"> };
  imap?: { host: string; port: number; source: Exclude<MailServerSource, "guess"> };
}

export type MailServerKind = "smtp" | "imap";

/** "ana@acme.com" -> "acme.com"; anything else -> "" */
export function emailDomain(address: string): string {
  const at = address.lastIndexOf("@");
  if (at < 1) return "";
  const domain = address.slice(at + 1).trim().toLowerCase();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? domain : "";
}

/** What the server found for that kind, or the usual name as a guess when it found nothing. */
export function suggestionFor(kind: MailServerKind, domain: string, found: ResolvedServers): SuggestedServer {
  const server = found[kind];
  if (server) return { domain, ...server };
  return kind === "smtp"
    ? { domain, host: `smtp.${domain}`, port: 587, source: "guess" }
    : { domain, host: `imap.${domain}`, port: 993, source: "guess" };
}

/**
 * Whether a suggestion should fill the host. The rule: it follows the domain of the address,
 * except when the person typed the host themselves. A host saved for this same domain is kept;
 * a new domain brings its own host, even over a saved one.
 */
export function shouldApplySuggestion(props: {
  suggestion: SuggestedServer;
  /** The domain whose host the field holds: the saved address's, or the last one applied */
  appliedDomain: string;
  hostTyped: boolean;
  currentHost: string;
}): boolean {
  if (props.hostTyped) return false;
  if (!props.currentHost.trim()) return true;
  return props.suggestion.domain !== props.appliedDomain;
}
