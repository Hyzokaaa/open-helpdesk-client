import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

const RATING_COLORS: Record<string, string> = {
  good: "#22c55e",
  neutral: "#f59e0b",
  bad: "#ef4444",
};

interface Props {
  data: { rating: string; count: number }[];
  score: number | null;
  total: number;
}

export default function CsatChart({ data, score, total }: Props) {
  const { t, tEnum } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.csat")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    name: tEnum("csat", d.rating),
    count: d.count,
    rating: d.rating,
  }));

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-body-semibold text-heading">{t("reports.csat")}</p>
        <div className="text-right">
          <span className="text-2xl font-body-bold text-heading">
            {score !== null ? `${Math.round(score)}%` : "—"}
          </span>
          <span className="text-xs text-subtle ml-2">
            ({total} {t("reports.csatResponses")})
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.csatResponses")}>
            {chartData.map((entry) => (
              <Cell key={entry.rating} fill={RATING_COLORS[entry.rating] ?? "#8884d8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
