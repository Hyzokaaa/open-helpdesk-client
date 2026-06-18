import useTranslation from "../../i18n/useTranslation";
import type { CompetitorData } from "../../data/competitors";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { Check, Cross } from "../icons/CompareIcons";

interface Props {
  competitor: CompetitorData;
}

export default function PricingCompare({ competitor }: Props) {
  const { t } = useTranslation();

  const rows = [
    {
      label: t("compare.pricing.startingPrice"),
      us: <span className="font-body-bold text-primary">$0</span>,
      them: <span className="text-muted">{t(competitor.theirPricingKey)}</span>,
    },
    {
      label: t("compare.pricing.perAgent"),
      us: <span className="text-sm text-primary font-body-medium">{t(competitor.ourPricingKey)}</span>,
      them: <span className="text-sm text-muted">{t(competitor.theirPricingKey)}</span>,
    },
    {
      label: t("compare.pricing.freeCloudPlan"),
      us: <Check />,
      them: <Cross />,
    },
    {
      label: t("compare.pricing.freeSelfHost"),
      us: <Check />,
      them: competitor.slug === "osticket" ? <Check /> : <Cross />,
    },
  ];

  return (
    <section className="py-24">
      <Container className="max-w-3xl">
        <SectionHeading title={t("compare.section.pricing")} />

        <div className="bg-white rounded-2xl border border-border-input overflow-hidden">
          <div className="grid grid-cols-3 text-sm font-body-bold text-heading bg-gray-50 border-b border-border-input">
            <div className="px-6 py-4" />
            <div className="px-6 py-4 text-center text-primary">Open Helpdesk</div>
            <div className="px-6 py-4 text-center text-muted">{t(competitor.nameKey)}</div>
          </div>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 text-sm ${i < rows.length - 1 ? "border-b border-border-input" : ""}`}
            >
              <div className="px-6 py-4 text-body font-body-medium">{row.label}</div>
              <div className="px-6 py-4 flex justify-center items-center">{row.us}</div>
              <div className="px-6 py-4 flex justify-center items-center">{row.them}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
