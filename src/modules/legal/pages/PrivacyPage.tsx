import { Link } from "react-router";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { TranslationKey } from "@modules/app/i18n/translations";

const sections = ["collect", "use", "storage", "access", "thirdParty", "rights", "cookies", "contact"] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/login" className="text-sm text-primary hover:underline font-body-medium">
          &larr; {t("legal.backToLogin")}
        </Link>

        <h1 className="text-3xl font-body-bold text-heading mt-6 mb-2">
          {t("legal.privacy.title")}
        </h1>

        <p className="text-body leading-relaxed mb-10">{t("legal.privacy.intro")}</p>

        {sections.map((key) => (
          <section key={key} className="mb-8">
            <h2 className="text-lg font-body-bold text-heading mb-2">
              {t(`legal.privacy.${key}.title` as TranslationKey)}
            </h2>
            <p className="text-sm text-secondary-text leading-relaxed">
              {t(`legal.privacy.${key}.desc` as TranslationKey)}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
