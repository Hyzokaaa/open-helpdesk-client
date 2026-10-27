/** How an account came to exist, as the backend records it (UserSignupMethod). */
export type SignupMethod = "signup" | "invitation" | "google" | "admin" | "import" | "integration" | "reporter";

/** Where a person came from before signing up, cleaned and classified by the backend. */
export interface SignupSourceInfo {
  channel: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ref: string | null;
  landingPath: string | null;
  firstSeenAt: string | null;
}

/** The names of the sites the backend recognises; any other channel is shown as it came (a host or a tag). */
const SITE_NAMES: Record<string, string> = {
  reddit: "Reddit",
  google: "Google",
  "hacker-news": "Hacker News",
  "product-hunt": "Product Hunt",
  github: "GitHub",
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  "stack-exchange": "Stack Exchange",
  alternativeto: "AlternativeTo",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  yahoo: "Yahoo",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
};

/** The channel as a person reads it, or null for `direct`, which the page words in its language. */
export function channelName(channel: string): string | null {
  if (channel === "direct") return null;
  return SITE_NAMES[channel] ?? channel;
}

/** Every detail the browser told, one per line, for the tooltip. */
export function sourceDetails(source: SignupSourceInfo): string[] {
  const lines: [string, string | null][] = [
    ["referrer", source.referrer],
    ["ref", source.ref],
    ["utm_source", source.utmSource],
    ["utm_medium", source.utmMedium],
    ["utm_campaign", source.utmCampaign],
    ["landing", source.landingPath],
  ];
  return lines.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
}
