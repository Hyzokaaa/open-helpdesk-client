import { http } from "@modules/app/modules/http/domain/http";

export interface UserStatsOverview {
  resolvedTotal: number;
  resolvedPeriod: number;
  totalAssigned: number;
  activeTickets: number;
  avgResolutionTimeHours: number | null;
  avgFirstResponseTimeHours: number | null;
  csatScore: number | null;
  csatResponseCount: number;
  ticketsCreated?: number;
  ticketsResolved?: number;
  ticketsPending?: number;
  csatGiven?: number | null;
}

export interface UserStatsUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface UserStatsData {
  isReporter: boolean;
  user: UserStatsUser | null;
  overview: UserStatsOverview;
  ticketsByStatus: { status: string; count: number }[];
  resolutionTrend: { date: string; resolved: number }[];
}

export async function getUserStats(
  workspaceSlug: string,
  dateFrom: string,
  dateTo: string,
  userId?: string,
): Promise<UserStatsData> {
  const path = userId
    ? `/workspaces/${workspaceSlug}/stats/${userId}`
    : `/workspaces/${workspaceSlug}/stats/me`;
  const res = await http.get<UserStatsData>(
    `${path}?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
  return res.data;
}
