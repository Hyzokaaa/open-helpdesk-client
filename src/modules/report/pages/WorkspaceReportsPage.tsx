import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { ReportData, ReportOverviewBasic, ReportOverview, getReport, getReportOverview } from "../services/report.service";
import DateRangeSelector from "../components/DateRangeSelector";
import OverviewCards from "../components/OverviewCards";
import TicketsOverTimeChart from "../components/TicketsOverTimeChart";
import TicketsByStatusChart from "../components/TicketsByStatusChart";
import TicketsByPriorityChart from "../components/TicketsByPriorityChart";
import TicketsByCategoryChart from "../components/TicketsByCategoryChart";
import TopAgentsChart from "../components/TopAgentsChart";
import CsatChart from "../components/CsatChart";

function getDateRange(preset: string) {
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return {
    dateFrom: format(startOfDay(subDays(now, days)), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    dateTo: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
  };
}

function toFullOverview(basic: ReportOverviewBasic): ReportOverview {
  return { ...basic, csatScore: null, csatResponseCount: 0, slaFirstResponseMet: null, slaResolutionMet: null };
}

export default function WorkspaceReportsPage() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { isPlanLimitError, PlanGate, getSubscription } = useExtensions();
  const [preset, setPreset] = useState("30d");
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartsLocked, setChartsLocked] = useState(false);
  const [csatLocked, setCsatLocked] = useState(false);

  useEffect(() => {
    if (!workspaceSlug) return;
    setLoading(true);
    const { dateFrom, dateTo } = getDateRange(preset);

    // Always fetch overview (free for all plans)
    const overviewPromise = getReportOverview(workspaceSlug, dateFrom, dateTo)
      .then((o) => setOverview(toFullOverview(o)))
      .catch(() => {});

    // Try full report (may 403 for Free/Starter)
    const reportPromise = getReport(workspaceSlug, dateFrom, dateTo, { silent: true })
      .then((d) => { setData(d); setOverview(d.overview); setChartsLocked(false); })
      .catch((err) => { if (isPlanLimitError(err)) setChartsLocked(true); });

    Promise.all([overviewPromise, reportPromise]).finally(() => setLoading(false));
  }, [workspaceSlug, preset]);

  useEffect(() => {
    getSubscription().then((sub: any) => {
      if (sub) setCsatLocked(sub.planId === "free");
    }).catch(() => {});
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("reports.title")}</h2>
        <DateRangeSelector selected={preset} onChange={setPreset} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : !overview && !data ? (
        <p className="text-sm text-muted text-center py-12">{t("reports.noData")}</p>
      ) : (
        <div className="space-y-4">
          {overview && <OverviewCards overview={overview} />}

          {chartsLocked ? (
            <div className="bg-surface border border-border-card rounded-xl shadow-sm">
              <PlanGate message={t("planLimit.reportsLocked")} />
            </div>
          ) : data ? (
            <>
              <TicketsOverTimeChart data={data.ticketsOverTime} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TicketsByStatusChart data={data.ticketsByStatus} />
                <TicketsByPriorityChart data={data.ticketsByPriority} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TicketsByCategoryChart data={data.ticketsByCategory} />
                <TopAgentsChart data={data.topAgents} />
              </div>
              <CsatChart
                data={data.csatBreakdown}
                score={data.overview.csatScore}
                total={data.overview.csatResponseCount}
                locked={csatLocked}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
