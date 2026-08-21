import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { organizationId: string; name: string; count: number }[];
}

export default function TicketsByOrganizationChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) return null;

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.byOrganization")}</p>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
