import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getPortalKbArticle, PortalKbArticleDetail } from "../services/portal.service";
import usePortalSlug, { usePortalBasePath } from "../hooks/usePortalSlug";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function PortalKbArticlePage() {
  const { t } = useTranslation();
  const workspaceSlug = usePortalSlug();
  const { articleSlug } = useParams();
  const basePath = usePortalBasePath();
  const [article, setArticle] = useState<PortalKbArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug || !articleSlug) return;
    getPortalKbArticle(workspaceSlug, articleSlug).then(setArticle).finally(() => setLoading(false));
  }, [workspaceSlug, articleSlug]);

  if (loading) return <div className="flex justify-center py-12 text-muted">{t("portalKb.loading")}</div>;
  if (!article) return <div className="text-center py-12 text-muted">{t("portalKb.articleNotFound")}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Link to={`${basePath}/kb`} className="text-xs text-primary hover:underline">{t("portalKb.helpCenter")}</Link>
        {article.category && (
          <>
            <span className="text-xs text-muted">/</span>
            <Link to={`${basePath}/kb/${article.category.slug}`} className="text-xs text-primary hover:underline">{article.category.name}</Link>
          </>
        )}
      </div>

      <h1 className="text-2xl font-bold text-heading mb-6">{article.title}</h1>

      <div className="kb-content text-sm text-body" dangerouslySetInnerHTML={{ __html: article.content }} />

      <div className="mt-12 pt-6 border-t border-border-card text-center">
        <p className="text-sm text-muted mb-2">{t("portalKb.didntFind")}</p>
        <Link to={basePath} className="text-sm text-primary hover:underline">{t("portalKb.createTicket")}</Link>
      </div>
    </div>
  );
}
