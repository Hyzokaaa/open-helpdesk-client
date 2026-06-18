import useTranslation from "../../i18n/useTranslation";
import type { CompetitorData } from "../../data/competitors";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";

interface Props {
  competitor: CompetitorData;
}

export default function AtAGlance({ competitor }: Props) {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-gray-50">
      <Container className="max-w-4xl">
        <SectionHeading title={t("compare.section.atAGlance")} />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Our highlights */}
          <div className="bg-white rounded-2xl border border-primary/20 p-8">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.svg" alt="Open Helpdesk" className="w-6 h-6" />
              <h3 className="font-body-bold text-heading text-lg">Open Helpdesk</h3>
            </div>
            <ul className="flex flex-col gap-3">
              {competitor.ourHighlightsKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 text-body">
                  <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Their pain points */}
          <div className="bg-white rounded-2xl border border-border-input p-8">
            <h3 className="font-body-bold text-heading text-lg mb-6">{t(competitor.nameKey)}</h3>
            <ul className="flex flex-col gap-3">
              {competitor.theirPainPointsKeys.map((key) => (
                <li key={key} className="flex items-start gap-3 text-muted">
                  <svg className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
