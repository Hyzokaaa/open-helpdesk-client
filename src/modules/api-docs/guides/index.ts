import type { ComponentType } from "react";
import type { TranslationKey } from "@modules/app/i18n/translations";
import type { GuideProps } from "./guide-types";
import IntroductionGuide from "./IntroductionGuide";
import AuthenticationGuide from "./AuthenticationGuide";
import ScopesGuide from "./ScopesGuide";
import RateLimitsGuide from "./RateLimitsGuide";
import ErrorsGuide from "./ErrorsGuide";
import TicketNumbersGuide from "./TicketNumbersGuide";
import DelegatedSignInGuide from "./DelegatedSignInGuide";
import WebhooksGuide from "./WebhooksGuide";

export interface Guide {
  slug: string;
  titleKey: TranslationKey;
  Component: ComponentType<GuideProps>;
}

/** Sidebar order. The first guide is the /docs landing page. */
export const GUIDES: Guide[] = [
  { slug: "introduction", titleKey: "apiDocs.guide.introduction", Component: IntroductionGuide },
  { slug: "authentication", titleKey: "apiDocs.guide.authentication", Component: AuthenticationGuide },
  { slug: "scopes", titleKey: "apiDocs.guide.scopes", Component: ScopesGuide },
  { slug: "rate-limits", titleKey: "apiDocs.guide.rateLimits", Component: RateLimitsGuide },
  { slug: "errors", titleKey: "apiDocs.guide.errors", Component: ErrorsGuide },
  { slug: "ticket-numbers", titleKey: "apiDocs.guide.ticketNumbers", Component: TicketNumbersGuide },
  { slug: "delegated-sign-in", titleKey: "apiDocs.guide.delegatedSignIn", Component: DelegatedSignInGuide },
  { slug: "webhooks", titleKey: "apiDocs.guide.webhooks", Component: WebhooksGuide },
];
