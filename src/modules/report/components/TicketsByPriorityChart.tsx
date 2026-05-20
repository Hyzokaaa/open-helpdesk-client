import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

interface Props {
  data: { priority: string; count: number }[];
}

export default function TicketsByPriorityChart({ data }: Props) {
  const { t, tEnum } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-3">{t("reports.byPriority")}</p>
        <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("priority", d.priority), count: d.count, priority: d.priority }));

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.byPriority")}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.tickets")} radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#8884d8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
