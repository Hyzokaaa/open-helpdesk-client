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

export interface ReportOverviewBasic {
  openTickets: number;
  resolvedThisPeriod: number;
  avgResolutionTimeHours: number | null;
  avgFirstResponseTimeHours: number | null;
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

function buildDateParams(dateFrom: string, dateTo: string): string {
  const parts: string[] = [];
  if (dateFrom) parts.push(`dateFrom=${dateFrom}`);
  if (dateTo) parts.push(`dateTo=${dateTo}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function getReportOverview(
  workspaceSlug: string,
  dateFrom: string,
  dateTo: string,
): Promise<ReportOverviewBasic> {
  const res = await http.get<ReportOverviewBasic>(
    `/workspaces/${workspaceSlug}/reports/overview${buildDateParams(dateFrom, dateTo)}`,
  );
  return res.data;
}

export async function getReport(
  workspaceSlug: string,
  dateFrom: string,
  dateTo: string,
  options?: { silent?: boolean },
): Promise<ReportData> {
  const res = await http.get<ReportData>(
    `/workspaces/${workspaceSlug}/reports${buildDateParams(dateFrom, dateTo)}`,
    options?.silent ? { headers: { 'X-Silent-Errors': 'true' } } : undefined,
  );
  return res.data;
}
