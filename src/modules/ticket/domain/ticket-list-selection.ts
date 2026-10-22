import { PRIORITIES, STATUSES } from "./ticket-enums";

/** In the department, organization and category filters, the tickets that have none. */
export const FILTER_NONE = "none";
/** In the department filter, the departments the viewer is an agent of, whichever they are at the time. */
export const FILTER_MINE = "mine";

/** What an agent sees by default: the tickets still to work on. */
export const ACTIVE_STATUSES: string[] = ["open", "pending", "in-progress"];

/**
 * The filters chosen in the popover. Within a filter any value matches; an empty list does not
 * filter. `statuses` is null while nothing was chosen, which means the default for the role.
 */
export interface TicketListSelection {
  statuses: string[] | null;
  priorities: string[];
  departmentIds: string[];
  organizationIds: string[];
  categoryIds: string[];
  tagIds: string[];
  /** Only the tickets reopened at least once. */
  reopened: boolean;
}

export const EMPTY_SELECTION: TicketListSelection = {
  statuses: null, priorities: [], departmentIds: [], organizationIds: [], categoryIds: [], tagIds: [], reopened: false,
};

/** Requesters see their whole history by default; the team, its queue. */
export function defaultStatuses(isReporter: boolean): string[] {
  return isReporter ? [...STATUSES] : ACTIVE_STATUSES;
}

/** The statuses ticked, in the usual order. */
export function shownStatuses(selection: TicketListSelection, isReporter: boolean): string[] {
  const chosen = selection.statuses ?? defaultStatuses(isReporter);
  return STATUSES.filter((s) => chosen.includes(s));
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v));

/** The statuses after ticking or unticking one; the last one ticked stays, so the list is never empty by mistake. */
export function toggleStatus(selection: TicketListSelection, status: string, isReporter: boolean): string[] | null {
  const shown = shownStatuses(selection, isReporter);
  if (shown.length === 1 && shown[0] === status) return selection.statuses;
  const next = shown.includes(status) ? shown.filter((s) => s !== status) : [...shown, status];
  return normalizeStatuses(next, isReporter);
}

/** "All" ticks every status; ticked again, it goes back to the default. */
export function toggleAllStatuses(selection: TicketListSelection, isReporter: boolean): string[] | null {
  const all = shownStatuses(selection, isReporter).length === STATUSES.length;
  return all ? null : normalizeStatuses([...STATUSES], isReporter);
}

/** The default is kept as null, so a later change of role or of the default still applies. */
function normalizeStatuses(statuses: string[], isReporter: boolean): string[] | null {
  return sameSet(statuses, defaultStatuses(isReporter)) ? null : STATUSES.filter((s) => statuses.includes(s));
}

export function isDefaultStatuses(selection: TicketListSelection, isReporter: boolean): boolean {
  return sameSet(shownStatuses(selection, isReporter), defaultStatuses(isReporter));
}

/** The statuses to ask the API for; none when every status is ticked. */
export function statusesParam(selection: TicketListSelection, isReporter: boolean): string[] | undefined {
  const shown = shownStatuses(selection, isReporter);
  return shown.length === STATUSES.length ? undefined : shown;
}

/** Adds the value, or takes it away when it is there. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** How many filters narrow the list: a filter counts once, however many values it has. */
export function selectionFilterCount(selection: TicketListSelection, isReporter: boolean): number {
  return (isDefaultStatuses(selection, isReporter) ? 0 : 1)
    + [selection.priorities, selection.departmentIds, selection.organizationIds, selection.categoryIds, selection.tagIds]
      .filter((list) => list.length > 0).length
    + (selection.reopened ? 1 : 0);
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string" && v.length > 0))] : [];

/** A remembered selection, keeping only what can still be a value; anything else is the default. */
export function parseSelection(raw: string | null): TicketListSelection {
  if (!raw) return EMPTY_SELECTION;
  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_SELECTION;
    data = parsed;
  } catch {
    return EMPTY_SELECTION;
  }
  const statuses = strings(data.statuses).filter((s) => (STATUSES as readonly string[]).includes(s));
  return {
    statuses: Array.isArray(data.statuses) && statuses.length ? statuses : null,
    priorities: strings(data.priorities).filter((p) => (PRIORITIES as readonly string[]).includes(p)),
    departmentIds: strings(data.departmentIds),
    organizationIds: strings(data.organizationIds),
    categoryIds: strings(data.categoryIds),
    tagIds: strings(data.tagIds).filter((id) => id !== FILTER_NONE),
    reopened: data.reopened === true,
  };
}

/** The ids the workspace has today, per filter; a filter left out is not checked. */
export interface KnownIds {
  departmentIds?: string[];
  organizationIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
}

/** Drops the departments, organizations, categories and tags that no longer exist. */
export function pruneSelection(selection: TicketListSelection, known: KnownIds): TicketListSelection {
  const keep = (list: string[], ids?: string[], specials = [FILTER_NONE]) =>
    ids ? list.filter((id) => specials.includes(id) || ids.includes(id)) : list;
  const next = {
    ...selection,
    departmentIds: keep(selection.departmentIds, known.departmentIds, [FILTER_NONE, FILTER_MINE]),
    organizationIds: keep(selection.organizationIds, known.organizationIds),
    categoryIds: keep(selection.categoryIds, known.categoryIds),
    tagIds: keep(selection.tagIds, known.tagIds, []),
  };
  const changed = (["departmentIds", "organizationIds", "categoryIds", "tagIds"] as const)
    .some((k) => next[k].length !== selection[k].length);
  return changed ? next : selection;
}

const storageKey = (workspaceSlug: string) => `ticket_filters:${workspaceSlug}`;

/** The selection this browser remembers for a workspace, or the default when storage is empty or blocked. */
export function readSelection(workspaceSlug: string | undefined): TicketListSelection {
  if (!workspaceSlug) return EMPTY_SELECTION;
  try {
    return parseSelection(window.localStorage.getItem(storageKey(workspaceSlug)));
  } catch {
    return EMPTY_SELECTION;
  }
}

export function saveSelection(workspaceSlug: string | undefined, selection: TicketListSelection): void {
  if (!workspaceSlug) return;
  try {
    window.localStorage.setItem(storageKey(workspaceSlug), JSON.stringify(selection));
  } catch {
    // Blocked storage: the selection lasts until the page is left
  }
}
