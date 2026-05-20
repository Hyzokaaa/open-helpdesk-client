import useTranslation from "@modules/app/i18n/useTranslation";
import { ReportOverview } from "../services/report.service";

interface Props {
  overview: ReportOverview;
}

const CARD_BORDERS = [
  "border-l-blue-500",
  "border-l-green-500",
  "border-l-amber-500",
  "border-l-purple-500",
  "border-l-pink-500",
];

export default function OverviewCards({ overview }: Props) {
  const { t } = useTranslation();

  const formatHours = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const formatCsat = (score: number | null) => {
    if (score === null) return "N/A";
    return `${Math.round(score)}%`;
  };

  const cards = [
    { label: t("reports.openTickets"), value: overview.openTickets },
    { label: t("reports.resolvedPeriod"), value: overview.resolvedThisPeriod },
    { label: t("reports.avgResolution"), value: formatHours(overview.avgResolutionTimeHours) },
    { label: t("reports.avgFirstResponse"), value: formatHours(overview.avgFirstResponseTimeHours) },
    { label: t("reports.csatScore"), value: formatCsat(overview.csatScore) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`bg-surface border border-border-card border-l-[3px] ${CARD_BORDERS[i]} rounded-xl p-4 shadow-sm`}
        >
          <p className="text-3xl font-body-bold text-heading">{c.value}</p>
          <p className="text-xs font-body-medium text-muted uppercase tracking-wide mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
