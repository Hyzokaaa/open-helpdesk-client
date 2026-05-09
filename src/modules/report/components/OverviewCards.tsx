import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";
import { ReportOverview } from "../services/report.service";

interface Props {
  overview: ReportOverview;
}

export default function OverviewCards({ overview }: Props) {
  const { t } = useTranslation();

  const formatHours = (hours: number | null) => {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const cards = [
    { label: t("reports.openTickets"), value: overview.openTickets },
    { label: t("reports.resolvedPeriod"), value: overview.resolvedThisPeriod },
    { label: t("reports.avgResolution"), value: formatHours(overview.avgResolutionTimeHours) },
    { label: t("reports.avgFirstResponse"), value: formatHours(overview.avgFirstResponseTimeHours) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4 text-center">
          <p className="text-2xl font-body-bold text-heading">{c.value}</p>
          <p className="text-xs text-subtle mt-1">{c.label}</p>
        </Card>
      ))}
    </div>
  );
}
