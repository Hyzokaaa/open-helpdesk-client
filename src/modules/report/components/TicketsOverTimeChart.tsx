import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { date: string; created: number; resolved: number }[];
}

export default function TicketsOverTimeChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.overTime")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.overTime")}</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="created" stroke="#3b82f6" name={t("reports.created")} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="resolved" stroke="#22c55e" name={t("reports.resolved")} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
