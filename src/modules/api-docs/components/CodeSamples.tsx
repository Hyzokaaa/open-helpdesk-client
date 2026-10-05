import { useState } from "react";
import useTranslation from "@modules/app/i18n/useTranslation";
import { SAMPLE_GENERATORS, type RequestSpec, type SampleLanguage } from "../domain/code-samples";
import CodeBlock from "./CodeBlock";

const STORAGE_KEY = "api_docs_sample_language";
const LANGUAGES = Object.keys(SAMPLE_GENERATORS) as SampleLanguage[];

function readLanguage(): SampleLanguage {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored as SampleLanguage) ? (stored as SampleLanguage) : "curl";
  } catch {
    return "curl";
  }
}

export default function CodeSamples({ request }: { request: RequestSpec }) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<SampleLanguage>(readLanguage);

  const choose = (id: string) => {
    setLanguage(id as SampleLanguage);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Remembered for this visit only
    }
  };

  return (
    <section>
      <h3 className="text-xs font-body-semibold text-subtle uppercase tracking-wide mb-2">{t("apiDocs.codeSamples")}</h3>
      <CodeBlock
        code={SAMPLE_GENERATORS[language].generate(request)}
        tabs={LANGUAGES.map((id) => ({ id, label: SAMPLE_GENERATORS[id].label }))}
        activeTab={language}
        onTabChange={choose}
      />
    </section>
  );
}
