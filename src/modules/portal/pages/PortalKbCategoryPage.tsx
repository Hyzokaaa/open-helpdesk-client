import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getPortalKbArticles, getPortalKbCategories, PortalKbArticlePreview } from "../services/portal.service";
import usePortalSlug, { usePortalBasePath } from "../hooks/usePortalSlug";
import useTranslation from "@modules/app/i18n/useTranslation";
import PortalKbLayout from "../components/PortalKbLayout";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export default function PortalKbCategoryPage() {
  const { t } = useTranslation();
  const workspaceSlug = usePortalSlug();
  const { categorySlug } = useParams();
  const basePath = usePortalBasePath();
  const [articles, setArticles] = useState<PortalKbArticlePreview[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!workspaceSlug || !categorySlug) return;
    Promise.all([
      getPortalKbArticles(workspaceSlug, categorySlug),
      getPortalKbCategories(workspaceSlug),
    ]).then(([arts, cats]) => {
      setArticles(arts);
      const cat = cats.find((c) => c.slug === categorySlug);
      setCategoryName(cat?.name || categorySlug);
    })
    .catch(() => setError(true))
    .finally(() => setLoading(false));
  }, [workspaceSlug, categorySlug]);

  return (
    <PortalKbLayout>
      {loading ? (
        <div className="flex justify-center py-12 text-muted">{t("portalKb.loading")}</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted mb-3">{t("portalKb.loadError")}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline cursor-pointer">{t("portalKb.retry")}</button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link to={`${basePath}/kb`} className="text-xs text-primary hover:underline mb-4 inline-block">
            ← {t("portalKb.backToHelpCenter")}
          </Link>

          <h1 className="text-xl font-bold text-heading mb-6">{categoryName}</h1>

          {articles.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">{t("portalKb.noArticlesInCategory")}</p>
          ) : (
            <div className="space-y-3">
              {articles.map((a) => (
                <Link key={a.id} to={`${basePath}/kb/article/${a.slug}`} className="block p-4 border border-border-card rounded-lg hover:bg-surface-hover transition-colors">
                  <p className="text-sm font-semibold text-heading">{a.title}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{stripHtml(a.content)}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted mb-2">{t("portalKb.didntFind")}</p>
            <Link to={basePath} className="text-sm text-primary hover:underline">{t("portalKb.createTicket")}</Link>
          </div>
        </div>
      )}
    </PortalKbLayout>
  );
}
