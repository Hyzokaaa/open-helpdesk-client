import { useEffect, useState } from "react";
import Card from "@modules/app/modules/ui/components/Card/Card";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { getChangelog, type ChangelogVersion } from "../services/changelog.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useUser from "@modules/user/hooks/useUser";

export default function ChangelogPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const lang = (user?.language === "es" ? "es" : "en") as "en" | "es";
  const [changelog, setChangelog] = useState<ChangelogVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChangelog()
      .then(setChangelog)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner width={24} /></div>;

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-lg font-body-bold text-heading mb-6">{t("changelog.title")}</h2>

      <div className="space-y-6">
        {changelog.map((release) => (
          <Card key={release.version} className="p-5">
            <div className="flex items-center gap-3 mb-6">
              <StatusBadge label={`v${release.version}`} color="primary" />
              <span className="text-xs text-muted">{release.date}</span>
            </div>

            <div className="space-y-5">
              {release.categories.map((category) => (
                <div key={category.title.en}>
                  <p className="text-xs font-body-semibold text-subtle uppercase mb-2">
                    {category.title[lang]}
                  </p>
                  <ul className="space-y-1.5">
                    {category.features.map((feature, i) => (
                      <li key={i} className="flex gap-2 text-sm text-body">
                        <span className="text-primary mt-0.5 shrink-0">-</span>
                        <span>{feature[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
