import { useEffect, useState } from "react";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { getChangelog, type ChangelogVersion } from "../services/changelog.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import ChangelogRelease from "../components/ChangelogRelease";

export default function ChangelogPage() {
  const { t, lang: uiLang } = useTranslation();
  const lang = (uiLang === "es" ? "es" : "en") as "en" | "es";
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
            <ChangelogRelease release={release} lang={lang} />
          </Card>
        ))}
      </div>
    </div>
  );
}
