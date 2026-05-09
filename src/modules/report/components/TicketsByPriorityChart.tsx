import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#22c55e",
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
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byPriority")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("priority", d.priority), count: d.count, priority: d.priority }));

  return (
    <Card className="p-4">
      <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byPriority")}</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.tickets")}>
            {chartData.map((entry) => (
              <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#8884d8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
