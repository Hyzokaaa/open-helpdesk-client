import useTranslation from "../../i18n/useTranslation";
import type { CompetitorData } from "../../data/competitors";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Accordion from "../ui/Accordion";

interface Props {
  competitor: CompetitorData;
}

export default function CompareFAQ({ competitor }: Props) {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-gray-50">
      <Container className="max-w-3xl">
        <SectionHeading title={t("compare.section.faq")} />
        <div>
          {competitor.faqKeys.map((faq) => (
            <Accordion
              key={faq.qKey}
              question={t(faq.qKey)}
              answer={t(faq.aKey)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
