import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { TicketFilters } from "../services/ticket.service";
import { PRIORITIES, STATUSES } from "../domain/ticket-enums";
import { FILTER_MINE, FILTER_NONE, TicketListSelection, shownStatuses } from "../domain/ticket-list-selection";
import type { SelectionListField } from "../hooks/useTicketFilters";
import { Tag } from "@modules/tag/services/tag.service";
import { Department } from "@modules/department/services/department.service";
import { Organization } from "@modules/organization/services/organization.service";
import { TicketCategoryDto } from "@modules/project/services/project.service";
import useTranslation from "@modules/app/i18n/useTranslation";

interface TicketFilterBarProps {
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  selection: TicketListSelection;
  toggleStatus: (status: string) => void;
  toggleAllStatuses: () => void;
  toggleIn: (field: SelectionListField, value: string) => void;
  clearField: (field: SelectionListField | "statuses" | "reopened") => void;
  toggleReopened: () => void;
  isReporter: boolean;
  tags: Tag[];
  departments: Department[];
  organizations: Organization[];
  categories: TicketCategoryDto[];
  activeFilterCount: number;
  isBoard?: boolean;
}

export default function TicketFilterBar({
  filters,
  setFilters,
  selection,
  toggleStatus,
  toggleAllStatuses,
  toggleIn,
  clearField,
  toggleReopened,
  isReporter,
  tags,
  departments,
  organizations,
  categories,
  activeFilterCount,
  isBoard,
}: TicketFilterBarProps) {
  const { t, tEnum } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value || undefined, page: 1 }));
    }, 300);
  };

  const statuses = shownStatuses(selection, isReporter);

  /** A list filter: "All" (nothing ticked), then "Mine" and "None" when they apply, then the values. */
  const listSection = (
    field: SelectionListField,
    label: string,
    allLabel: string,
    noneLabel: string | null,
    items: { id: string; name: string; color?: string }[],
    mineLabel?: string,
  ) => {
    const ticked = selection[field];
    return (
      <FilterSection label={label}>
        <div className="flex flex-col gap-1">
          <FilterCheckbox checked={ticked.length === 0} onChange={() => clearField(field)} label={allLabel} />
          {mineLabel && (
            <FilterCheckbox checked={ticked.includes(FILTER_MINE)} onChange={() => toggleIn(field, FILTER_MINE)} label={mineLabel} />
          )}
          {noneLabel && (
            <FilterCheckbox checked={ticked.includes(FILTER_NONE)} onChange={() => toggleIn(field, FILTER_NONE)} label={noneLabel} muted />
          )}
          {items.map((item) => (
            <FilterCheckbox
              key={item.id}
              checked={ticked.includes(item.id)}
              onChange={() => toggleIn(field, item.id)}
              label={item.name}
              color={item.color}
            />
          ))}
        </div>
      </FilterSection>
    );
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-0 max-w-md">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("tickets.search")}
          className="w-full pl-8 pr-3 py-1.5 rounded-input border-input bg-surface text-sm text-body placeholder:text-muted focus:outline-none focus:border-primary-400 transition-colors"
        />
      </div>

      {/* Filters popover — right-aligned; always there, since the status filter always applies */}
      <div ref={popoverRef} className="relative shrink-0 ml-auto">
        <button
          type="button"
          onClick={() => setPopoverOpen(!popoverOpen)}
          aria-expanded={popoverOpen}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-input border text-sm cursor-pointer transition-colors",
            activeFilterCount > 0
              ? "bg-surface-active border-primary-300 text-primary"
              : "bg-surface border-border-input text-muted hover:text-body",
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <span>{t("tickets.filters")}</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-on-primary text-exs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {popoverOpen && (
          <div className="absolute right-0 z-50 mt-1 bg-surface border border-border-input rounded-lg shadow-lg w-72 max-h-[420px] overflow-y-auto">
            <div className="p-3 space-y-4">
              {/* Status: on the board the columns already are the statuses */}
              {!isBoard && (
                <FilterSection label={t("tickets.col.status")}>
                  <div className="flex flex-col gap-1">
                    <FilterCheckbox checked={statuses.length === STATUSES.length} onChange={toggleAllStatuses} label={t("tickets.all")} />
                    {STATUSES.map((s) => {
                      const last = statuses.length === 1 && statuses[0] === s;
                      return (
                        <FilterCheckbox
                          key={s}
                          checked={statuses.includes(s)}
                          onChange={() => toggleStatus(s)}
                          label={tEnum("status", s)}
                          disabled={last}
                          hint={last ? t("tickets.lastStatus") : undefined}
                        />
                      );
                    })}
                  </div>
                </FilterSection>
              )}

              {listSection("priorities", t("tickets.col.priority"), t("tickets.allFeminine"), null,
                PRIORITIES.map((p) => ({ id: p, name: tEnum("priority", p) })))}

              {departments.length > 0 && listSection("departmentIds", t("ticketDetail.department"), t("tickets.all"), t("tickets.noDepartment"), departments,
                departments.some((d) => d.isMember) || selection.departmentIds.includes(FILTER_MINE) ? t("tickets.myDepartments") : undefined)}

              {organizations.length > 0 && listSection("organizationIds", t("ticketDetail.organization"), t("tickets.allFeminine"), t("tickets.noOrganization"), organizations)}

              {categories.length > 0 && listSection("categoryIds", t("ticketDetail.category"), t("tickets.allFeminine"), t("tickets.noCategory"), categories)}

              {tags.length > 0 && listSection("tagIds", t("tickets.col.tags"), t("tickets.allFeminine"), null,
                tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color ?? undefined })))}

              {!isReporter && (
                <FilterSection label={t("reopen.filterSection")}>
                  <FilterCheckbox checked={selection.reopened} onChange={toggleReopened} label={`↺ ${t("reopen.filter")}`} />
                </FilterSection>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p aria-hidden="true" className="text-exs text-subtle font-body-medium uppercase mb-1.5">{label}</p>
      {children}
    </div>
  );
}

/** `disabled` with a `hint`: the hint says why, both on hover and to screen readers. */
function FilterCheckbox({ checked, onChange, label, color, muted, disabled, hint }: { checked: boolean; onChange: () => void; label: string; color?: string; muted?: boolean; disabled?: boolean; hint?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-description={hint}
      title={hint}
      onClick={() => !disabled && onChange()}
      className={clsx(
        "flex items-center gap-2 px-2 py-1 rounded text-xs font-body-medium transition-colors text-left w-full",
        disabled ? "cursor-default" : "cursor-pointer",
        checked ? "bg-surface-active text-primary" : "text-secondary-text hover:bg-surface-hover",
        muted && !checked && "italic",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center",
          checked ? "bg-primary-600 border-primary-600 text-on-primary" : "border-border-input bg-surface",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
            <path d="m2.5 6 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
