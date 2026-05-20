import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  data: { date: string; created: number; resolved: number }[];
}

export default function TicketsOverTimeChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-heading mb-3">{t("reports.overTime")}</p>
        <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
      </div>
    );
  }

  const sparse = data.length <= 3;

  return (
    <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-heading mb-3">{t("reports.overTime")}</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="created" stroke="#6366f1" fill="url(#colorCreated)" name={t("reports.created")} strokeWidth={2} dot={sparse ? { r: 4 } : false} />
          <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" name={t("reports.resolved")} strokeWidth={2} dot={sparse ? { r: 4 } : false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
