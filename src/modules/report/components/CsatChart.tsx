import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";

const RATING_COLORS: Record<string, string> = {
  good: "#22c55e",
  neutral: "#f59e0b",
  bad: "#ef4444",
};

interface Props {
  data: { rating: string; count: number }[];
  score: number | null;
  total: number;
  locked?: boolean;
}

export default function CsatChart({ data, score, total, locked }: Props) {
  const { t, tEnum } = useTranslation();
  const { PlanGate } = useExtensions();

  if (locked) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-1">{t("reports.csat")}</p>
        <PlanGate message={t("planLimit.csatLocked")} />
      </div>
    );
  }

  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: tEnum("csat", d.rating),
    count: d.count,
    rating: d.rating,
  }));

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-heading">{t("reports.csat")}</p>
        <div className="text-right">
          <span className="text-2xl font-body-bold text-heading">
            {score !== null ? `${Math.round(score)}%` : "N/A"}
          </span>
          <span className="text-xs text-muted ml-2">
            ({total} {t("reports.csatResponses")})
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData} layout="vertical" barSize={20}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.csatResponses")} radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.rating} fill={RATING_COLORS[entry.rating] ?? "#8884d8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
