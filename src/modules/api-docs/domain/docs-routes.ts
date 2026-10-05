/** Routes of the public docs section. */
export const DOCS_BASE = "/docs";

/** The guide served at /docs itself. */
export const LANDING_GUIDE = "introduction";

export const DOCS_ROUTES = {
  root: DOCS_BASE,
  guide: (slug: string) => (slug === LANDING_GUIDE ? DOCS_BASE : `${DOCS_BASE}/${slug}`),
  operation: (slug: string) => `${DOCS_BASE}/reference/${slug}`,
};
