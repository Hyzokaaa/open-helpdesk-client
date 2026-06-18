import clsx from "clsx";
import useTranslation from "../../i18n/useTranslation";
import type { CompetitorData, CompetitorFeatureRow } from "../../data/competitors";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { Check, Cross, Dash } from "../icons/CompareIcons";

interface Props {
  competitor: CompetitorData;
}

function CellValue({ value }: { value: CompetitorFeatureRow["us"] }) {
  const { t } = useTranslation();

  if (value === "check") return <Check />;
  if (value === "cross") return <Cross />;
  if (value === "dash") return <Dash />;
  return <span className="text-sm text-muted">{t(value)}</span>;
}

export default function CompareTable({ competitor }: Props) {
  const { t } = useTranslation();

  return (
    <section className="py-24">
      <Container className="max-w-3xl">
        <SectionHeading
          title={t("compare.section.features")}
        />

        <div className="bg-white rounded-2xl border border-border-input overflow-hidden">
          <div className="grid grid-cols-3 text-sm font-body-bold text-heading bg-gray-50 border-b border-border-input">
            <div className="px-6 py-4">{t("compare.pricing.feature")}</div>
            <div className="px-6 py-4 text-center text-primary">{t("compare.pricing.us")}</div>
            <div className="px-6 py-4 text-center text-muted">{t(competitor.nameKey)}</div>
          </div>
          {competitor.featureRows.map((row, i) => (
            <div
              key={row.labelKey}
              className={clsx(
                "grid grid-cols-3 text-sm",
                i < competitor.featureRows.length - 1 && "border-b border-border-input",
              )}
            >
              <div className="px-6 py-4 text-body">{t(row.labelKey)}</div>
              <div className="px-6 py-4 flex justify-center items-center">
                <CellValue value={row.us} />
              </div>
              <div className="px-6 py-4 flex justify-center items-center">
                <CellValue value={row.them} />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
