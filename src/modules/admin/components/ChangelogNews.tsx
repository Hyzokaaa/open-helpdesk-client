import { useEffect, useState } from "react";
import { Link } from "react-router";
import Card from "@modules/app/modules/ui/components/Card/Card";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import ChangelogRelease from "@modules/app/components/ChangelogRelease";
import type { ChangelogVersion } from "@modules/app/services/changelog.service";
import useChangelogNews from "../hooks/useChangelogNews";
import { newestVersion } from "../domain/changelog-news";

/**
 * What the versions not seen yet bring, at the top of Updates. Opening the page counts as seeing
 * them, which clears the sidebar mark; the card keeps them for this visit and later shrinks to the
 * newest version, folded.
 */
export default function ChangelogNews() {
  const { t, lang: uiLang } = useTranslation();
  const lang = (uiLang === "es" ? "es" : "en") as "en" | "es";
  const { changelog, unseen, markSeen } = useChangelogNews(true);
  const [shown, setShown] = useState<ChangelogVersion[] | null>(null);

  useEffect(() => {
    if (!changelog || shown) return;
    setShown(unseen);
    markSeen();
  }, [changelog, shown, unseen, markSeen]);

  if (!changelog || changelog.length === 0 || !shown) return null;

  const allLink = (
    <div className="flex justify-end mt-4 pt-3 border-t border-border-card">
      <Link to="/dashboard/changelog" className="text-sm font-body-semibold text-primary hover:underline">
        {t("admin.newsAll")} →
      </Link>
    </div>
  );

  if (shown.length > 0) {
    return (
      <Card className="p-5 mt-6 border-primary">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-body-semibold text-heading">{t("admin.newsTitle")}</h3>
          {shown.length > 1 && (
            <span className="rounded-full bg-primary/10 px-2 text-exs leading-5 font-body-bold text-primary">
              {t("admin.newsCount").replace("{count}", String(shown.length))}
            </span>
          )}
        </div>
        <div className="space-y-6">
          {shown.map((release) => (
            <ChangelogRelease key={release.version} release={release} lang={lang} />
          ))}
        </div>
        {allLink}
      </Card>
    );
  }

  const latest = changelog.find((v) => v.version === newestVersion(changelog)) ?? changelog[0];
  return (
    <Card className="p-5 mt-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-body-semibold text-heading">{t("admin.newsLatest")}</h3>
        <StatusBadge label={`v${latest.version}`} color="primary" />
        <span className="text-xs text-muted">{latest.date}</span>
      </div>
      <details className="mt-3 group">
        <summary className="cursor-pointer text-sm font-body-semibold text-primary">{t("admin.newsShowLatest")}</summary>
        <div className="mt-3">
          <ChangelogRelease release={latest} lang={lang} header={false} />
        </div>
      </details>
      {allLink}
    </Card>
  );
}
