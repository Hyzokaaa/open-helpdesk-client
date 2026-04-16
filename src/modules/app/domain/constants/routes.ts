export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  WORKSPACES: "/dashboard/workspaces",
  WORKSPACE_DETAIL: "/dashboard/workspaces/:workspaceSlug",
  WORKSPACE_MEMBERS: "/dashboard/workspaces/:workspaceSlug/members",
  WORKSPACE_TAGS: "/dashboard/workspaces/:workspaceSlug/tags",
  TICKETS: "/dashboard/workspaces/:workspaceSlug/tickets",
  TICKET_CREATE: "/dashboard/workspaces/:workspaceSlug/tickets/new",
  TICKET_DETAIL: "/dashboard/workspaces/:workspaceSlug/tickets/:ticketId",
} as const;
