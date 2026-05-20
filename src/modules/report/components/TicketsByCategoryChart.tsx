import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { category: string; count: number }[];
}

export default function TicketsByCategoryChart({ data }: Props) {
  const { t, tEnum } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-3">{t("reports.byCategory")}</p>
        <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: tEnum("category", d.category), count: d.count }));

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.byCategory")}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="count" name={t("reports.tickets")} fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
