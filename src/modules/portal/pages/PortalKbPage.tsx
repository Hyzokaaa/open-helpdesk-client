import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getPortalKbCategories, searchPortalKb, PortalKbCategory, PortalKbArticlePreview } from "../services/portal.service";
import usePortalSlug, { usePortalBasePath } from "../hooks/usePortalSlug";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export default function PortalKbPage() {
  const workspaceSlug = usePortalSlug();
  const basePath = usePortalBasePath();
  const [categories, setCategories] = useState<PortalKbCategory[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PortalKbArticlePreview[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug) return;
    getPortalKbCategories(workspaceSlug).then(setCategories).finally(() => setLoading(false));
  }, [workspaceSlug]);

  useEffect(() => {
    if (!workspaceSlug || search.length < 2) { setResults(null); return; }
    const timeout = setTimeout(() => {
      searchPortalKb(workspaceSlug, search).then(setResults);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, workspaceSlug]);

  if (loading) return <div className="flex justify-center py-12 text-muted">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-heading mb-2">Help Center</h1>
      <p className="text-muted mb-6">Browse articles or search for answers.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search articles..."
        className="w-full px-4 py-3 border border-border-input rounded-lg text-sm bg-surface text-body outline-none mb-6"
      />

      {results ? (
        <div>
          <p className="text-xs text-muted mb-3">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No articles found.</p>
          ) : (
            <div className="space-y-3">
              {results.map((a) => (
                <Link key={a.id} to={`${basePath}/kb/article/${a.slug}`} className="block p-4 border border-border-card rounded-lg hover:bg-surface-hover transition-colors">
                  <p className="text-sm font-semibold text-heading">{a.title}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{stripHtml(a.content)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Link key={cat.id} to={`${basePath}/kb/${cat.slug}`} className="p-4 border border-border-card rounded-lg hover:bg-surface-hover transition-colors">
              <p className="text-sm font-semibold text-heading">{cat.name}</p>
              <p className="text-xs text-muted mt-1">{cat.articleCount} article{cat.articleCount !== 1 ? "s" : ""}</p>
            </Link>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted col-span-2 text-center py-8">No articles available yet.</p>
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-muted mb-2">Didn't find what you need?</p>
        <Link to={`${basePath}`} className="text-sm text-primary hover:underline">Create a ticket</Link>
      </div>
    </div>
  );
}
