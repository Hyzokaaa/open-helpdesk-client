import { http } from "@modules/app/modules/http/domain/http";

export interface ReportOverview {
  openTickets: number;
  resolvedThisPeriod: number;
  avgResolutionTimeHours: number | null;
  avgFirstResponseTimeHours: number | null;
  csatScore: number | null;
  csatResponseCount: number;
  slaFirstResponseMet: number | null;
  slaResolutionMet: number | null;
}

export interface ReportData {
  overview: ReportOverview;
  ticketsOverTime: { date: string; created: number; resolved: number }[];
  ticketsByStatus: { status: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByCategory: { category: string; count: number }[];
  topAgents: { resolvedById: string; name: string; resolved: number }[];
  csatBreakdown: { rating: string; count: number }[];
}

export async function getReport(
  workspaceSlug: string,
  dateFrom: string,
  dateTo: string,
): Promise<ReportData> {
  const res = await http.get<ReportData>(
    `/workspaces/${workspaceSlug}/reports?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
  return res.data;
}
