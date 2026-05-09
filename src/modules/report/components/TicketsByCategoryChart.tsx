import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { category: string; count: number }[];
}

export default function TicketsByCategoryChart({ data }: Props) {
  const { t, tEnum } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byCategory")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("category", d.category), count: d.count }));

  return (
    <Card className="p-4">
      <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.byCategory")}</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.tickets")} fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
