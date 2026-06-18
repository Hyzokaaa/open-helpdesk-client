import type { TranslationKey } from "../i18n/translations";

export interface CompetitorFeatureRow {
  labelKey: TranslationKey;
  us: "check" | "cross" | "dash" | TranslationKey;
  them: "check" | "cross" | "dash" | TranslationKey;
}

export interface CompetitorData {
  slug: string;
  nameKey: TranslationKey;
  titleKey: TranslationKey;
  headlineKey: TranslationKey;
  subtitleKey: TranslationKey;
  descriptionKey: TranslationKey;
  ourHighlightsKeys: TranslationKey[];
  theirPainPointsKeys: TranslationKey[];
  featureRows: CompetitorFeatureRow[];
  differentiators: {
    iconKey: string;
    titleKey: TranslationKey;
    descKey: TranslationKey;
  }[];
  theirPricingKey: TranslationKey;
  ourPricingKey: TranslationKey;
  faqKeys: { qKey: TranslationKey; aKey: TranslationKey }[];
}

const zendeskFeatureRows: CompetitorFeatureRow[] = [
  { labelKey: "pricingPage.compare.openSource", us: "check", them: "cross" },
  { labelKey: "pricingPage.compare.selfHosted", us: "check", them: "cross" },
  { labelKey: "compare.zendesk.feat.cloudHosted", us: "check", them: "check" },
  {
    labelKey: "pricingPage.compare.multiWorkspace",
    us: "pricingPage.compare.fromStarter",
    them: "compare.zendesk.feat.multiWorkspace",
  },
  {
    labelKey: "pricingPage.compare.unlimitedTickets",
    us: "check",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.emailToTicket",
    us: "check",
    them: "check",
  },
  { labelKey: "compare.zendesk.feat.kanban", us: "check", them: "cross" },
  {
    labelKey: "pricingPage.compare.sla",
    us: "pricingPage.compare.fromStarter",
    them: "compare.zendesk.feat.sla",
  },
  {
    labelKey: "pricingPage.compare.csat",
    us: "pricingPage.compare.fromStarter",
    them: "compare.zendesk.feat.csat",
  },
  {
    labelKey: "pricingPage.compare.cannedResponses",
    us: "pricingPage.compare.fromStarter",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.customFields",
    us: "check",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.customerPortal",
    us: "check",
    them: "compare.zendesk.feat.portal",
  },
  {
    labelKey: "pricingPage.compare.auditLog",
    us: "pricingPage.compare.fromBusiness",
    them: "compare.zendesk.feat.auditLog",
  },
  { labelKey: "compare.zendesk.feat.modernUi", us: "check", them: "check" },
  { labelKey: "pricingPage.compare.reports", us: "check", them: "check" },
];

const osticketFeatureRows: CompetitorFeatureRow[] = [
  { labelKey: "pricingPage.compare.openSource", us: "check", them: "check" },
  { labelKey: "pricingPage.compare.selfHosted", us: "check", them: "check" },
  {
    labelKey: "compare.osticket.feat.cloudHosted",
    us: "compare.shared.feat.cloudFree",
    them: "compare.osticket.feat.cloudPaid",
  },
  {
    labelKey: "pricingPage.compare.multiWorkspace",
    us: "pricingPage.compare.fromStarter",
    them: "cross",
  },
  {
    labelKey: "pricingPage.compare.unlimitedTickets",
    us: "check",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.emailToTicket",
    us: "check",
    them: "check",
  },
  { labelKey: "compare.osticket.feat.kanban", us: "check", them: "cross" },
  {
    labelKey: "pricingPage.compare.sla",
    us: "pricingPage.compare.fromStarter",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.csat",
    us: "pricingPage.compare.fromStarter",
    them: "cross",
  },
  {
    labelKey: "pricingPage.compare.cannedResponses",
    us: "pricingPage.compare.fromStarter",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.customFields",
    us: "check",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.customerPortal",
    us: "check",
    them: "check",
  },
  {
    labelKey: "pricingPage.compare.auditLog",
    us: "pricingPage.compare.fromBusiness",
    them: "compare.osticket.feat.auditPremium",
  },
  { labelKey: "compare.osticket.feat.modernUi", us: "check", them: "cross" },
  { labelKey: "pricingPage.compare.reports", us: "check", them: "check" },
];

export const COMPETITORS: Record<string, CompetitorData> = {
  zendesk: {
    slug: "zendesk",
    nameKey: "compare.zendesk.name",
    titleKey: "compare.zendesk.title",
    headlineKey: "compare.zendesk.headline",
    subtitleKey: "compare.zendesk.subtitle",
    descriptionKey: "compare.zendesk.description",
    ourHighlightsKeys: [
      "compare.zendesk.ourHighlight.1",
      "compare.zendesk.ourHighlight.2",
      "compare.zendesk.ourHighlight.3",
      "compare.zendesk.ourHighlight.4",
      "compare.zendesk.ourHighlight.5",
    ],
    theirPainPointsKeys: [
      "compare.zendesk.theirPain.1",
      "compare.zendesk.theirPain.2",
      "compare.zendesk.theirPain.3",
      "compare.zendesk.theirPain.4",
      "compare.zendesk.theirPain.5",
    ],
    featureRows: zendeskFeatureRows,
    differentiators: [
      {
        iconKey: "pricing",
        titleKey: "compare.zendesk.diff.pricing.title",
        descKey: "compare.zendesk.diff.pricing.desc",
      },
      {
        iconKey: "opensource",
        titleKey: "compare.zendesk.diff.opensource.title",
        descKey: "compare.zendesk.diff.opensource.desc",
      },
      {
        iconKey: "workspace",
        titleKey: "compare.zendesk.diff.workspace.title",
        descKey: "compare.zendesk.diff.workspace.desc",
      },
      {
        iconKey: "ui",
        titleKey: "compare.zendesk.diff.simplicity.title",
        descKey: "compare.zendesk.diff.simplicity.desc",
      },
    ],
    theirPricingKey: "compare.zendesk.theirPricing",
    ourPricingKey: "compare.zendesk.ourPricing",
    faqKeys: [
      {
        qKey: "compare.zendesk.faq.migration.q",
        aKey: "compare.zendesk.faq.migration.a",
      },
      {
        qKey: "compare.zendesk.faq.pricing.q",
        aKey: "compare.zendesk.faq.pricing.a",
      },
      {
        qKey: "compare.zendesk.faq.features.q",
        aKey: "compare.zendesk.faq.features.a",
      },
      {
        qKey: "compare.zendesk.faq.selfhost.q",
        aKey: "compare.zendesk.faq.selfhost.a",
      },
      {
        qKey: "compare.zendesk.faq.reliability.q",
        aKey: "compare.zendesk.faq.reliability.a",
      },
    ],
  },
  osticket: {
    slug: "osticket",
    nameKey: "compare.osticket.name",
    titleKey: "compare.osticket.title",
    headlineKey: "compare.osticket.headline",
    subtitleKey: "compare.osticket.subtitle",
    descriptionKey: "compare.osticket.description",
    ourHighlightsKeys: [
      "compare.osticket.ourHighlight.1",
      "compare.osticket.ourHighlight.2",
      "compare.osticket.ourHighlight.3",
      "compare.osticket.ourHighlight.4",
      "compare.osticket.ourHighlight.5",
    ],
    theirPainPointsKeys: [
      "compare.osticket.theirPain.1",
      "compare.osticket.theirPain.2",
      "compare.osticket.theirPain.3",
      "compare.osticket.theirPain.4",
      "compare.osticket.theirPain.5",
    ],
    featureRows: osticketFeatureRows,
    differentiators: [
      {
        iconKey: "ui",
        titleKey: "compare.osticket.diff.modernUi.title",
        descKey: "compare.osticket.diff.modernUi.desc",
      },
      {
        iconKey: "workspace",
        titleKey: "compare.osticket.diff.workspace.title",
        descKey: "compare.osticket.diff.workspace.desc",
      },
      {
        iconKey: "cloud",
        titleKey: "compare.osticket.diff.hosting.title",
        descKey: "compare.osticket.diff.hosting.desc",
      },
      {
        iconKey: "features",
        titleKey: "compare.osticket.diff.builtIn.title",
        descKey: "compare.osticket.diff.builtIn.desc",
      },
    ],
    theirPricingKey: "compare.osticket.theirPricing",
    ourPricingKey: "compare.osticket.ourPricing",
    faqKeys: [
      {
        qKey: "compare.osticket.faq.migration.q",
        aKey: "compare.osticket.faq.migration.a",
      },
      {
        qKey: "compare.osticket.faq.differences.q",
        aKey: "compare.osticket.faq.differences.a",
      },
      {
        qKey: "compare.osticket.faq.hosting.q",
        aKey: "compare.osticket.faq.hosting.a",
      },
      {
        qKey: "compare.osticket.faq.features.q",
        aKey: "compare.osticket.faq.features.a",
      },
      {
        qKey: "compare.osticket.faq.community.q",
        aKey: "compare.osticket.faq.community.a",
      },
    ],
  },
};
