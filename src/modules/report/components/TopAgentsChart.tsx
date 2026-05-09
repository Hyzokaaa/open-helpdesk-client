import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card from "@modules/app/modules/ui/components/Card/Card";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { resolvedById: string; name: string; resolved: number }[];
}

export default function TopAgentsChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.topAgents")}</p>
        <p className="text-sm text-muted text-center py-8">{t("reports.noData")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-body-semibold text-heading mb-4">{t("reports.topAgents")}</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
          <Tooltip />
          <Bar dataKey="resolved" name={t("reports.resolved")} fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
