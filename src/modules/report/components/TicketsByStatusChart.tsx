import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

const STATUS_COLORS: Record<string, string> = {
  open: "#eab308",
  pending: "#f59e0b",
  "in-progress": "#3b82f6",
  resolved: "#22c55e",
  discarded: "#ef4444",
};

interface Props {
  data: { status: string; count: number }[];
}

export default function TicketsByStatusChart({ data }: Props) {
  const { t, tEnum } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byStatus")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("status", d.status), value: d.count, status: d.status }));

  return (
    <Card className="p-4">
      <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byStatus")}</p>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#8884d8"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
