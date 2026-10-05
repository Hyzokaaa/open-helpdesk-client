import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import DocsHeader from "../components/DocsHeader";
import DocsSidebar from "../components/DocsSidebar";
import OperationView from "../components/OperationView";
import { groupOperations, findOperation } from "../domain/operations";
import { DOCS_ROUTES, LANDING_GUIDE } from "../domain/docs-routes";
import { GUIDES } from "../guides";
import type { DocsLang } from "../guides/guide-types";
import useOpenApiDocument from "../hooks/useOpenApiDocument";
import { API_BASE_URL, OPENAPI_DOCUMENT_URL } from "../services/openapi.service";

function LoadError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl rounded-lg border border-border-card bg-surface p-6">
      <h1 className="text-lg font-body-bold text-heading mb-2">{t("apiDocs.loadError")}</h1>
      <p className="text-sm text-body mb-2">{t("apiDocs.loadErrorHint")}</p>
      <p className="text-xs text-muted font-mono break-all mb-4">
        {OPENAPI_DOCUMENT_URL} · {error}
      </p>
      <Button onClick={onRetry} color="light" size="base">{t("apiDocs.retry")}</Button>
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl">
      <p className="text-sm text-body mb-3">{t("apiDocs.notFound")}</p>
      <Link to={DOCS_ROUTES.root} className="text-sm text-primary hover:underline">{t("apiDocs.title")}</Link>
    </div>
  );
}

/**
 * Public API documentation: hand-written guides plus a reference generated from the backend's
 * OpenAPI document. Public route, no session needed; works the same on custom domains.
 */
export default function ApiDocsPage() {
  const { t, lang } = useTranslation();
  const { brandName } = useConfig();
  const { section, operation: operationSlug } = useParams();
  const { pathname } = useLocation();
  const { document, loading, error, retry } = useOpenApiDocument();
  const [menuOpen, setMenuOpen] = useState(false);

  const docsLang: DocsLang = lang === "es" ? "es" : "en";
  const groups = useMemo(() => (document ? groupOperations(document) : []), [document]);

  const guide = operationSlug ? undefined : GUIDES.find((g) => g.slug === (section ?? LANDING_GUIDE));
  const operation = operationSlug ? findOperation(groups, operationSlug) : undefined;
  const guideIndex = guide ? GUIDES.indexOf(guide) : -1;

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const page = guide ? t(guide.titleKey) : operation?.operation.summary;
    window.document.title = [page, t("apiDocs.title"), brandName].filter(Boolean).join(" · ");
  }, [guide, operation, brandName, t]);

  let content: React.ReactNode;
  if (operationSlug) {
    if (loading) content = <div className="flex items-center gap-3 text-sm text-muted"><Spinner /> {t("apiDocs.loading")}</div>;
    else if (error || !document) content = <LoadError error={error ?? ""} onRetry={retry} />;
    else if (!operation) content = <NotFound />;
    else content = <OperationView key={operation.slug} document={document} op={operation} baseUrl={API_BASE_URL} />;
  } else if (guide) {
    const prev = GUIDES[guideIndex - 1];
    const next = GUIDES[guideIndex + 1];
    content = (
      <article className="max-w-3xl">
        <guide.Component lang={docsLang} document={document} groups={groups} baseUrl={API_BASE_URL} />
        <nav className="mt-12 pt-6 border-t border-border-card flex justify-between gap-4 text-sm">
          {prev ? (
            <Link to={DOCS_ROUTES.guide(prev.slug)} className="text-secondary-text hover:text-primary">
              ← {t(prev.titleKey)}
            </Link>
          ) : <span />}
          {next ? (
            <Link to={DOCS_ROUTES.guide(next.slug)} className="text-secondary-text hover:text-primary text-right">
              {t(next.titleKey)} →
            </Link>
          ) : groups[0]?.operations[0] ? (
            <Link to={DOCS_ROUTES.operation(groups[0].operations[0].slug)} className="text-secondary-text hover:text-primary text-right">
              {t("apiDocs.reference")} →
            </Link>
          ) : <span />}
        </nav>
      </article>
    );
  } else {
    content = <NotFound />;
  }

  return (
    <div className="min-h-dvh bg-page">
      <DocsHeader onMenuToggle={() => setMenuOpen((open) => !open)} />
      <div className="flex">
        <DocsSidebar groups={groups} loading={loading} error={error} mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="flex-1 min-w-0 px-4 md:px-8 py-8">
          <div className="mx-auto max-w-6xl">{content}</div>
        </main>
      </div>
    </div>
  );
}
