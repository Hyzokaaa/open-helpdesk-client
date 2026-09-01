export interface TicketSnapshot {
  name: string;
  description: string;
  priority: string;
  status: string;
  categoryId: string | null;
  projectId: string | null;
  assigneeId: string | null;
  tagIds: string[];
  departmentId: string | null;
  organizationId: string | null;
  customFields: Record<string, unknown>;
}

export interface FieldChange {
  field: string;
  from: string;
  to: string;
}

interface LookupItem {
  id: string;
  name: string;
}

interface CustomFieldDef {
  id: string;
  name: string;
}

export interface ChangeLookups {
  projects: LookupItem[];
  categories: LookupItem[];
  tags: LookupItem[];
  departments: LookupItem[];
  organizations: LookupItem[];
  customFieldDefs: CustomFieldDef[];
  getMemberName: (id: string) => string;
  t: (key: string) => string;
  tEnum: (prefix: string, value: string) => string;
}

function findName(items: LookupItem[], id: string | null): string {
  if (!id) return "—";
  return items.find((i) => i.id === id)?.name ?? "—";
}

function formatCustomFieldValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function getTicketChanges(
  original: TicketSnapshot,
  draft: TicketSnapshot,
  lookups: ChangeLookups,
): FieldChange[] {
  const { t, tEnum, getMemberName, projects, categories, tags, departments, organizations, customFieldDefs } = lookups;
  const changes: FieldChange[] = [];

  if (draft.name !== original.name) {
    changes.push({ field: t("ticketDetail.name"), from: original.name, to: draft.name });
  }

  if (draft.description !== original.description) {
    const truncate = (s: string) => s.slice(0, 50) + (s.length > 50 ? "..." : "");
    changes.push({ field: t("ticketDetail.description"), from: truncate(original.description), to: truncate(draft.description) });
  }

  if (draft.status !== original.status) {
    changes.push({ field: t("ticketDetail.status"), from: tEnum("status", original.status), to: tEnum("status", draft.status) });
  }

  if (draft.priority !== original.priority) {
    changes.push({ field: t("ticketDetail.priority"), from: tEnum("priority", original.priority), to: tEnum("priority", draft.priority) });
  }

  if (draft.projectId !== original.projectId) {
    changes.push({ field: t("ticketDetail.project"), from: findName(projects, original.projectId), to: findName(projects, draft.projectId) });
  }

  if (draft.categoryId !== original.categoryId) {
    changes.push({ field: t("ticketDetail.category"), from: findName(categories, original.categoryId), to: findName(categories, draft.categoryId) });
  }

  if (draft.assigneeId !== original.assigneeId) {
    changes.push({
      field: t("ticketDetail.assignee"),
      from: original.assigneeId ? getMemberName(original.assigneeId) : "—",
      to: draft.assigneeId ? getMemberName(draft.assigneeId) : "—",
    });
  }

  if (JSON.stringify(draft.tagIds) !== JSON.stringify(original.tagIds)) {
    const formatTags = (ids: string[]) => ids.map((id) => tags.find((t) => t.id === id)?.name ?? id).join(", ") || "—";
    changes.push({ field: t("ticketDetail.tags"), from: formatTags(original.tagIds), to: formatTags(draft.tagIds) });
  }

  if (draft.departmentId !== original.departmentId) {
    changes.push({ field: t("ticketDetail.department"), from: findName(departments, original.departmentId), to: findName(departments, draft.departmentId) });
  }

  if (draft.organizationId !== original.organizationId) {
    changes.push({ field: t("ticketDetail.organization"), from: findName(organizations, original.organizationId), to: findName(organizations, draft.organizationId) });
  }

  const origCf = original.customFields ?? {};
  const draftCf = draft.customFields ?? {};
  for (const def of customFieldDefs) {
    const origVal = origCf[def.id];
    const draftVal = draftCf[def.id];
    if (JSON.stringify(origVal) !== JSON.stringify(draftVal)) {
      changes.push({ field: def.name, from: formatCustomFieldValue(origVal), to: formatCustomFieldValue(draftVal) });
    }
  }

  return changes;
}
