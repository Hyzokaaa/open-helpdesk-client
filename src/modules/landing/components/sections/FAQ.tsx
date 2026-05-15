import useTranslation from "../../i18n/useTranslation";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Accordion from "../ui/Accordion";

export default function FAQ() {
  const { t } = useTranslation();

  const questions = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  return (
    <section id="faq" className="py-24 bg-page">
      <Container className="max-w-3xl">
        <SectionHeading title={t("faq.heading")} subtitle={t("faq.subheading")} />
        <div>
          {questions.map((item) => (
            <Accordion key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </Container>
    </section>
  );
}
