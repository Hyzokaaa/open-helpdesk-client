import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import clsx from "clsx";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";
import { canBeDepartmentAgent, matchesPerson } from "../domain/department-agents";

interface Props {
  workspaceSlug: string;
  /** Everyone in the workspace; only the team can be picked. */
  members: WorkspaceMember[];
  /** The agents chosen, in the order they were added. */
  value: string[];
  onChange: (userIds: string[]) => void;
  /** Names of chosen agents that are not in `members` any more (left the workspace). */
  knownNames?: Record<string, string>;
  /** A system admin off the team: offered to join from the list, and then added. */
  join?: { label: string; onJoin: () => void; joining?: boolean };
  canInvite?: boolean;
}

export interface AgentMultiSelectHandle {
  focus: () => void;
}

const fullName = (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`.trim();

/**
 * Picks several agents with a search, as chips. The list stays open while choosing; Enter ticks
 * or unticks, Backspace in the empty search takes out the last chip, Esc closes. People who can
 * not be agents only show when the search finds them, with the reason.
 */
const AgentMultiSelect = forwardRef<AgentMultiSelectHandle, Props>(function AgentMultiSelect(
  { workspaceSlug, members, value, onChange, knownNames = {}, join, canInvite },
  ref,
) {
  const { t, tEnum } = useTranslation();
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number }>({ left: 0, width: 0, top: 0, maxHeight: 320 });
  useImperativeHandle(ref, () => ({ focus: () => { inputRef.current?.focus(); setOpen(true); } }));

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || dropRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // The list is drawn over the page, outside the sheet that scrolls (it would be cut there):
  // below the field, or above it when there is more room there; never taller than the window
  const place = useCallback(() => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const gap = 4, margin = 8, wanted = 320;
    const below = window.innerHeight - rect.bottom - gap - margin;
    const above = rect.top - gap - margin;
    const up = below < Math.min(wanted, 200) && above > below;
    setPos(up
      ? { left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + gap, maxHeight: Math.min(wanted, above) }
      : { left: rect.left, width: rect.width, top: rect.bottom + gap, maxHeight: Math.min(wanted, Math.max(below, 120)) });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place, value.length]);
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => { if (!dropRef.current?.contains(e.target as Node)) place(); };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", place); };
  }, [open, place]);

  const byId = useMemo(() => new Map(members.map((m) => [m.userId, m])), [members]);
  const eligible = members.filter((m) => canBeDepartmentAgent(m.role) && matchesPerson(m, query));
  const ineligible = query.trim() ? members.filter((m) => !canBeDepartmentAgent(m.role) && matchesPerson(m, query)) : [];
  const hiddenUsers = members.filter((m) => !canBeDepartmentAgent(m.role)).length;
  const activeIndex = Math.min(active, Math.max(0, eligible.length - 1));
  const optionId = (i: number) => `${id}-opt-${i}`;

  const toggle = (userId: string) => {
    const name = byId.get(userId) ? fullName(byId.get(userId)!) : knownNames[userId] ?? "";
    if (value.includes(userId)) {
      onChange(value.filter((v) => v !== userId));
      setAnnounce(t("departments.agentRemovedNamed").replace("{name}", name));
    } else {
      onChange([...value, userId]);
      setAnnounce(t("departments.agentAddedNamed").replace("{name}", name));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (eligible.length) setActive((i) => (Math.min(i, eligible.length - 1) + (e.key === "ArrowDown" ? 1 : eligible.length - 1)) % eligible.length);
    } else if (e.key === "Enter") {
      if (open && eligible[activeIndex]) { e.preventDefault(); toggle(eligible[activeIndex].userId); }
    } else if (e.key === "Backspace" && !query && value.length) {
      toggle(value[value.length - 1]);
    } else if (e.key === "Escape" && open) {
      // The first Esc closes the list; the next one reaches the sheet
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        ref={boxRef}
        className={clsx(
          "flex flex-wrap items-center gap-1.5 min-h-10 px-2 py-1.5 rounded-input border bg-surface transition-colors",
          open ? "border-primary-400" : "border-border-input",
        )}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {value.length > 0 && (
          <ul aria-label={t("departments.selectedAgents")} className="contents">
            {value.map((userId) => {
              const m = byId.get(userId);
              const name = m ? fullName(m) : knownNames[userId] ?? userId;
              const notTeam = m && !canBeDepartmentAgent(m.role);
              return (
                <li key={userId} className={clsx(
                  "inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs border",
                  notTeam ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-surface-active text-primary border-primary/20",
                )}>
                  <span title={notTeam ? t("departments.notTeamAnymore") : undefined}>{name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggle(userId); }}
                    aria-label={t("departments.removeAgentNamed").replace("{name}", name)}
                    className="w-6 h-6 -my-1 flex items-center justify-center rounded-full hover:text-red-500 cursor-pointer"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={open && eligible.length ? optionId(activeIndex) : undefined}
          aria-label={t("departments.agents")}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "" : t("departments.searchAgents")}
          className="flex-1 min-w-[8rem] bg-transparent text-sm text-body placeholder:text-muted focus:outline-none py-0.5"
        />
      </div>
      <p role="status" aria-live="polite" className="sr-only">{announce}</p>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
          className="fixed z-[9999] flex flex-col bg-surface border border-border-input rounded-lg shadow-lg overflow-hidden"
        >
          <ul id={`${id}-listbox`} role="listbox" aria-multiselectable="true" aria-label={t("departments.agents")} className="flex-1 min-h-0 overflow-y-auto py-1">
            {eligible.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted">{t("departments.noMatch")}</li>
            )}
            {eligible.map((m, i) => {
              const selected = value.includes(m.userId);
              return (
                <li
                  key={m.userId}
                  id={optionId(i)}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(m.userId)}
                  onMouseEnter={() => setActive(i)}
                  className={clsx("flex items-center gap-2 px-3 py-1.5 cursor-pointer", i === activeIndex && "bg-surface-hover")}
                >
                  <span aria-hidden="true" className={clsx(
                    "w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center text-[10px]",
                    selected ? "bg-primary-600 border-primary-600 text-on-primary" : "border-border-input",
                  )}>{selected && "✓"}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-heading truncate">{fullName(m)}</span>
                    <span className="block text-xs text-muted truncate">{m.email} · {tEnum("role", m.role)}</span>
                  </span>
                </li>
              );
            })}
            {ineligible.length > 0 && (
              <li role="group" aria-labelledby={`${id}-cant`}>
                <p id={`${id}-cant`} className="px-3 pt-2 pb-1 text-exs uppercase text-subtle font-body-medium">{t("departments.cantBeAdded")}</p>
                <ul>
                  {ineligible.map((m) => (
                    <li key={m.userId} role="option" aria-selected={false} aria-disabled="true" className="px-3 py-1.5 opacity-70 cursor-default">
                      <span className="block text-sm text-heading truncate">{fullName(m)}</span>
                      <span className="block text-xs text-muted">{t("departments.userRoleReason")}</span>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
          <div className="shrink-0 border-t border-border-card px-3 py-2 space-y-1.5 text-xs">
            {join && (
              <p className="text-muted">
                {join.label}{" "}
                <button type="button" onClick={join.onJoin} disabled={join.joining} className="text-primary hover:underline cursor-pointer font-body-medium">
                  {t("departments.joinAndAdd")}
                </button>
              </p>
            )}
            {ineligible.length > 0 && (
              <p className="text-muted">
                <Link to={`/dashboard/workspaces/${workspaceSlug}/members`} className="text-primary hover:underline">{t("departments.changeRoleInMembers")}</Link>
              </p>
            )}
            {!query.trim() && hiddenUsers > 0 && (
              <p className="text-muted">{t("departments.usersHidden").replace("{count}", String(hiddenUsers))}</p>
            )}
            {canInvite && (
              <p className="text-muted">
                {t("departments.someoneMissing")}{" "}
                <Link to={`/dashboard/workspaces/${workspaceSlug}/invitations`} className="text-primary hover:underline">{t("departments.inviteMember")}</Link>
              </p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
});

export default AgentMultiSelect;
