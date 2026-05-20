import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

const STATUS_COLORS: Record<string, string> = {
  open: "#eab308",
  pending: "#f59e0b",
  "in-progress": "#6366f1",
  resolved: "#22c55e",
  discarded: "#ef4444",
};

interface Props {
  data: { status: string; count: number }[];
}

export default function TicketsByStatusChart({ data }: Props) {
  const { t, tEnum } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-3">{t("reports.byStatus")}</p>
        <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("status", d.status), value: d.count, status: d.status }));

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.byStatus")}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} label={false}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#8884d8"} />
            ))}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-heading text-2xl font-bold">{total}</text>
          <Tooltip />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
