import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import useColumnDrag from "@modules/shared/hooks/useColumnDrag";
import SortableTh from "@modules/app/modules/ui/components/SortableTh/SortableTh";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import useFormatDate from "@modules/app/hooks/useFormatDate";
import DateRangeSelector from "../components/DateRangeSelector";
import { UserStatsData, getUserStats } from "../services/user-stats.service";
import { listTickets, type TicketListItem } from "@modules/ticket/services/ticket.service";

const STATUS_COLORS: Record<string, string> = {
  open: "#eab308",
  pending: "#f59e0b",
  "in-progress": "#6366f1",
  resolved: "#22c55e",
  discarded: "#ef4444",
};

const CARD_BORDERS = [
  "border-l-green-500",
  "border-l-cyan-500",
  "border-l-blue-500",
  "border-l-amber-500",
  "border-l-purple-500",
  "border-l-pink-500",
];

function getDateRange(preset: string) {
  if (preset === "all") return { dateFrom: "", dateTo: "" };
  const now = new Date();
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return {
    dateFrom: format(startOfDay(subDays(now, days)), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    dateTo: format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
  };
}

export default function UserStatsPage() {
  const { workspaceSlug, userId } = useParams();
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const formatDate = useFormatDate();
  const [preset, setPreset] = useState("30d");
  const [dateField, setDateField] = useState<"received" | "sent">("received");
  const [data, setData] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketSortBy, setTicketSortBy] = useState("createdAt");
  const [ticketSortOrder, setTicketSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketView, setTicketView] = useState<"assigned" | "reported">("assigned");

  const TICKET_COLUMNS = [
    { key: "ticketNumber", label: t("tickets.col.number"), sortable: true },
    { key: "name", label: t("tickets.col.name"), sortable: true },
    { key: "status", label: t("tickets.col.status"), sortable: true },
    { key: "priority", label: t("tickets.col.priority"), sortable: true },
    { key: "createdAt", label: t("tickets.col.created"), sortable: true },
  ];
  const sensors = useSensors(useSensor(PointerSensor));
  const { order: colOrder, handleDragEnd, reorder } = useColumnDrag(TICKET_COLUMNS.map((c) => c.key));

  const toggleTicketSort = (key: string) => {
    if (ticketSortBy === key) {
      setTicketSortOrder((o) => (o === "ASC" ? "DESC" : "ASC"));
    } else {
      setTicketSortBy(key);
      setTicketSortOrder("ASC");
    }
    setTicketPage(1);
  };

  useEffect(() => {
    if (!workspaceSlug) return;
    setLoading(true);
    const { dateFrom, dateTo } = getDateRange(preset);
    getUserStats(workspaceSlug, dateFrom, dateTo, userId, dateField)
      .then(setData)
      .finally(() => setLoading(false));
  }, [workspaceSlug, preset, userId, dateField]);

  useEffect(() => {
    if (!workspaceSlug || !userId || !data) return;
    const filter = data.isReporter
      ? { reporterId: userId }
      : ticketView === "reported"
        ? { reporterId: userId }
        : { assigneeId: userId };
    listTickets(workspaceSlug, {
      ...filter,
      ...(ticketStatus ? { status: ticketStatus } : {}),
      page: ticketPage, limit: 10, sortBy: ticketSortBy, sortOrder: ticketSortOrder,
    }).then((res) => { setTickets(res.items); setTicketTotal(res.total); });
  }, [workspaceSlug, userId, data?.isReporter, ticketPage, ticketSortBy, ticketSortOrder, ticketStatus, ticketView]);

  const formatHours = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const formatCsat = (score: number | null) => {
    if (score === null) return "N/A";
    return `${Math.round(score)}%`;
  };

  const roleColor = (r: string) => {
    if (r === "admin") return "primary" as const;
    if (r === "agent") return "blue" as const;
    return "gray" as const;
  };

  const initials = (first: string, last: string) => {
    return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "?";
  };

  const isReporter = data?.isReporter ?? false;
  const title = userId
    ? t("stats.userPerformance")
    : isReporter
      ? t("stats.myTickets")
      : t("stats.myPerformance");
  const targetUser = data?.user;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {targetUser && (
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-body-bold text-primary">
                {initials(targetUser.firstName, targetUser.lastName)}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-body-bold text-heading">
                {targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : title}
              </h2>
              {targetUser && (
                <StatusBadge label={tEnum("role", targetUser.role)} color={roleColor(targetUser.role)} size="xs" />
              )}
            </div>
            {targetUser && (
              <p className="text-xs text-muted">{targetUser.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {data?.isReporter && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted whitespace-nowrap">{t("stats.dateBy")}</span>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value as "received" | "sent")}
                className="text-sm bg-surface border border-border-card rounded px-2 py-1 text-body cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="received">{t("stats.dateImport")}</option>
                <option value="sent">{t("stats.dateEmail")}</option>
              </select>
            </div>
          )}
          <DateRangeSelector selected={preset} onChange={setPreset} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : !data ? (
        <p className="text-sm text-muted text-center py-12">{t("reports.noData")}</p>
      ) : (
        <div className="space-y-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {(isReporter ? [
              { label: t("stats.ticketsCreated"), value: data.overview.ticketsCreated ?? 0, desc: t("stats.ticketsCreatedDesc") },
              { label: t("stats.ticketsResolved"), value: data.overview.ticketsResolved ?? 0, desc: t("stats.ticketsResolvedDesc") },
              { label: t("stats.ticketsPending"), value: data.overview.ticketsPending ?? 0, desc: t("stats.ticketsPendingDesc") },
              { label: t("reports.avgResolution"), value: formatHours(data.overview.avgResolutionTimeHours), desc: t("stats.reporterAvgResolutionDesc") },
              { label: t("stats.csatGiven"), value: formatCsat(data.overview.csatGiven ?? null), desc: t("stats.csatGivenDesc") },
            ] : [
              { label: t("stats.resolvedTotal"), value: data.overview.resolvedTotal, desc: t("stats.resolvedTotalDesc"), sub: `${data.overview.resolvedPeriod} ${t("stats.thisPeriod")}` },
              { label: t("stats.totalAssigned"), value: data.overview.totalAssigned, desc: t("stats.totalAssignedDesc") },
              { label: t("stats.activeTickets"), value: data.overview.activeTickets, desc: t("stats.activeTicketsDesc") },
              { label: t("reports.avgResolution"), value: formatHours(data.overview.avgResolutionTimeHours), desc: t("stats.avgResolutionDesc") },
              { label: t("reports.avgFirstResponse"), value: formatHours(data.overview.avgFirstResponseTimeHours), desc: t("stats.avgFirstResponseDesc") },
              { label: t("reports.csatScore"), value: formatCsat(data.overview.csatScore), desc: t("stats.csatDesc"), sub: data.overview.csatResponseCount > 0 ? `${data.overview.csatResponseCount} ${t("reports.csatResponses")}` : undefined },
            ]).map((c, i) => (
              <div
                key={c.label}
                className={`bg-surface border border-border-card border-l-[3px] ${CARD_BORDERS[i]} rounded-xl p-4 shadow-sm`}
              >
                <p className="text-3xl font-body-bold text-heading">{c.value}</p>
                <p className="text-xs font-body-medium text-muted uppercase tracking-wide mt-1">{c.label}</p>
                <p className="text-xs text-muted mt-0.5">{c.desc}</p>
                {"sub" in c && c.sub && <p className="text-exs text-subtle mt-0.5">{c.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tickets by Status */}
            <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-heading mb-3">
                {isReporter ? t("stats.yourTicketsByStatus") : t("stats.yourAssignedTickets")}
              </p>
              {data.ticketsByStatus.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.ticketsByStatus.map((d) => ({ name: tEnum("status", d.status), value: d.count, status: d.status }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      label={false}
                    >
                      {data.ticketsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#8884d8"} />
                      ))}
                    </Pie>
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-heading text-2xl font-bold"
                    >
                      {data.ticketsByStatus.reduce((s, d) => s + d.count, 0)}
                    </text>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Resolution Trend / Creation Trend */}
            <div className="bg-surface border border-border-card rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-heading mb-3">
                {isReporter ? t("stats.creationTrend") : t("stats.resolutionTrend")}
              </p>
              {data.resolutionTrend.length === 0 ? (
                <p className="text-sm text-muted text-center py-10">{t("reports.noData")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.resolutionTrend}>
                    <defs>
                      <linearGradient id="colorUserResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-card, #e5e7eb)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickCount={4} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      fill="url(#colorUserResolved)"
                      name={isReporter ? t("stats.ticketsCreated") : t("reports.resolved")}
                      strokeWidth={2}
                      dot={data.resolutionTrend.length <= 3 ? { r: 4 } : false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tickets Table */}
          {userId && (
            <div className="bg-surface border border-border-card rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border-card flex items-center justify-between">
                <p className="text-sm font-semibold text-heading">
                  {isReporter
                    ? t("stats.reportedTickets")
                    : ticketView === "reported"
                      ? t("stats.reportedTickets")
                      : t("stats.assignedTickets")} ({ticketTotal})
                </p>
                <div className="flex items-center gap-2">
                {!isReporter && (
                  <select
                    value={ticketView}
                    onChange={(e) => { setTicketView(e.target.value as "assigned" | "reported"); setTicketPage(1); }}
                    className="text-sm bg-surface border border-border-card rounded px-2 py-1 text-body cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="assigned">{t("stats.viewAssigned")}</option>
                    <option value="reported">{t("stats.viewReported")}</option>
                  </select>
                )}
                <select
                  value={ticketStatus}
                  onChange={(e) => { setTicketStatus(e.target.value); setTicketPage(1); }}
                  className="text-sm bg-surface border border-border-card rounded px-2 py-1 text-body cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">{t("tickets.allStatuses")}</option>
                  {["open", "pending", "in-progress", "resolved", "discarded"].map((s) => (
                    <option key={s} value={s}>{tEnum("status", s)}</option>
                  ))}
                </select>
                </div>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full table-fixed">
                <thead>
                  <SortableContext items={colOrder} strategy={horizontalListSortingStrategy}>
                  <tr className="border-b border-border-card bg-surface-hover">
                    {reorder(TICKET_COLUMNS).map((col) => (
                      <SortableTh key={col.key} id={col.key} sortable={col.sortable} onClick={() => col.sortable && toggleTicketSort(col.key)}>
                        {col.label}
                        {col.sortable && ticketSortBy === col.key && (
                          <span className="text-primary ml-1">{ticketSortOrder === "ASC" ? "↑" : "↓"}</span>
                        )}
                      </SortableTh>
                    ))}
                  </tr>
                  </SortableContext>
                </thead>
                <tbody>
                  {tickets.length === 0 && (
                    <tr><td colSpan={TICKET_COLUMNS.length} className="px-4 py-8 text-center text-sm text-muted">{t("reports.noData")}</td></tr>
                  )}
                  {tickets.map((tk) => (
                    <tr
                      key={tk.id}
                      className="border-b border-border-row hover:bg-surface-hover cursor-pointer transition-colors"
                      onClick={() => navigate(`/dashboard/workspaces/${workspaceSlug}/tickets/${tk.id}`)}
                    >
                      {reorder(TICKET_COLUMNS).map((col) => (
                        <td key={col.key} className="px-4 py-2">
                          {col.key === "ticketNumber" && <span className="text-xs text-muted">#{tk.ticketNumber}</span>}
                          {col.key === "name" && <span className="text-sm text-heading block truncate">{tk.name}</span>}
                          {col.key === "status" && <StatusBadge label={tEnum("status", tk.status)} color={tk.status === "resolved" ? "green" : tk.status === "open" ? "yellow" : "blue"} size="xs" />}
                          {col.key === "priority" && <StatusBadge label={tEnum("priority", tk.priority)} color={tk.priority === "urgent" ? "red" : tk.priority === "high" ? "yellow" : "gray"} size="xs" />}
                          {col.key === "createdAt" && <span className="text-xs text-muted">{tk.createdAt ? formatDate(tk.createdAt) : "—"}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </DndContext>
              {ticketTotal > 10 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-border-card">
                  <span className="text-xs text-muted">
                    {(ticketPage - 1) * 10 + 1}–{Math.min(ticketPage * 10, ticketTotal)} {t("stats.paginationOf")} {ticketTotal}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={ticketPage <= 1}
                      onClick={() => setTicketPage((p) => p - 1)}
                      className="px-2 py-1 text-xs text-muted hover:text-heading disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ← {t("tickets.previous")}
                    </button>
                    <button
                      disabled={ticketPage * 10 >= ticketTotal}
                      onClick={() => setTicketPage((p) => p + 1)}
                      className="px-2 py-1 text-xs text-muted hover:text-heading disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      {t("tickets.next")} →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
