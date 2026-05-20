import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { resolvedById: string; name: string; resolved: number }[];
}

export default function TopAgentsChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-3">{t("reports.topAgents")}</p>
        <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.topAgents")}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar dataKey="resolved" name={t("reports.resolved")} fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
