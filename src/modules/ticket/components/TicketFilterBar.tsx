import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { TicketFilters } from "../services/ticket.service";
import { PRIORITIES, STATUSES } from "../domain/ticket-enums";
import { Tag } from "@modules/tag/services/tag.service";
import { Department } from "@modules/department/services/department.service";
import { Organization } from "@modules/organization/services/organization.service";
import { TicketCategoryDto } from "@modules/project/services/project.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { Tab } from "../hooks/useTicketFilters";

interface TicketFilterBarProps {
  tab: Tab;
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  filterTagIds: string[];
  setFilterTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  filterDepartmentId: string | undefined;
  setFilterDepartmentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterOrganizationId: string | undefined;
  setFilterOrganizationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  filterCategoryId: string | undefined;
  setFilterCategoryId: React.Dispatch<React.SetStateAction<string | undefined>>;
  tags: Tag[];
  departments: Department[];
  organizations: Organization[];
  categories: TicketCategoryDto[];
  activeFilterCount: number;
  isBoard?: boolean;
}

export default function TicketFilterBar({
  tab,
  filters,
  setFilters,
  filterTagIds,
  setFilterTagIds,
  filterDepartmentId,
  setFilterDepartmentId,
  filterOrganizationId,
  setFilterOrganizationId,
  filterCategoryId,
  setFilterCategoryId,
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

  const hasDimensions =
    departments.length > 0 ||
    organizations.length > 0 ||
    categories.length > 0 ||
    tags.length > 0;

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

      {/* Filters popover */}
      {hasDimensions && (
        <div ref={popoverRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPopoverOpen(!popoverOpen)}
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
                {/* Status (only in active tab, list view) */}
                {tab === "active" && !isBoard && (
                  <FilterSection label={t("tickets.col.status")}>
                    <div className="flex flex-wrap gap-1">
                      <FilterPill
                        active={!filters.status}
                        onClick={() => setFilters((f) => ({ ...f, status: undefined, page: 1 }))}
                      >
                        {t("tickets.all")}
                      </FilterPill>
                      {STATUSES.filter((s) => s !== "resolved" && s !== "discarded").map((s) => (
                        <FilterPill
                          key={s}
                          active={filters.status === s}
                          onClick={() => setFilters((f) => ({ ...f, status: s, page: 1 }))}
                        >
                          {tEnum("status", s)}
                        </FilterPill>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Priority */}
                <FilterSection label={t("tickets.col.priority")}>
                  <div className="flex flex-wrap gap-1">
                    <FilterPill
                      active={!filters.priority}
                      onClick={() => setFilters((f) => ({ ...f, priority: undefined, page: 1 }))}
                    >
                      {t("tickets.all")}
                    </FilterPill>
                    {PRIORITIES.map((p) => (
                      <FilterPill
                        key={p}
                        active={filters.priority === p}
                        onClick={() => setFilters((f) => ({ ...f, priority: p, page: 1 }))}
                      >
                        {tEnum("priority", p)}
                      </FilterPill>
                    ))}
                  </div>
                </FilterSection>

                {/* Department */}
                {departments.length > 0 && (
                  <FilterSection label={t("ticketDetail.department")}>
                    <div className="flex flex-col gap-1">
                      <FilterCheckbox
                        checked={!filterDepartmentId}
                        onChange={() => setFilterDepartmentId(undefined)}
                        label={t("tickets.all")}
                      />
                      {departments.map((d) => (
                        <FilterCheckbox
                          key={d.id}
                          checked={filterDepartmentId === d.id}
                          onChange={() => setFilterDepartmentId(filterDepartmentId === d.id ? undefined : d.id)}
                          label={d.name}
                        />
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Organization */}
                {organizations.length > 0 && (
                  <FilterSection label={t("ticketDetail.organization")}>
                    <div className="flex flex-col gap-1">
                      <FilterCheckbox
                        checked={!filterOrganizationId}
                        onChange={() => setFilterOrganizationId(undefined)}
                        label={t("tickets.all")}
                      />
                      {organizations.map((o) => (
                        <FilterCheckbox
                          key={o.id}
                          checked={filterOrganizationId === o.id}
                          onChange={() => setFilterOrganizationId(filterOrganizationId === o.id ? undefined : o.id)}
                          label={o.name}
                        />
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Category */}
                {categories.length > 0 && (
                  <FilterSection label={t("ticketDetail.category")}>
                    <div className="flex flex-col gap-1">
                      <FilterCheckbox
                        checked={!filterCategoryId}
                        onChange={() => setFilterCategoryId(undefined)}
                        label={t("tickets.all")}
                      />
                      {categories.map((c) => (
                        <FilterCheckbox
                          key={c.id}
                          checked={filterCategoryId === c.id}
                          onChange={() => setFilterCategoryId(filterCategoryId === c.id ? undefined : c.id)}
                          label={c.name}
                        />
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <FilterSection label={t("tickets.col.tags")}>
                    <div className="flex flex-col gap-1">
                      {tags.map((tag) => (
                        <FilterCheckbox
                          key={tag.id}
                          checked={filterTagIds.includes(tag.id)}
                          onChange={() => {
                            const ids = filterTagIds.includes(tag.id)
                              ? filterTagIds.filter((id) => id !== tag.id)
                              : [...filterTagIds, tag.id];
                            setFilterTagIds(ids);
                            setFilters((f) => ({ ...f, page: 1 }));
                          }}
                          label={tag.name}
                          color={tag.color ?? undefined}
                        />
                      ))}
                    </div>
                  </FilterSection>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-exs text-subtle font-body-medium uppercase mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-2.5 py-1 rounded text-xs font-body-medium transition-colors cursor-pointer whitespace-nowrap",
        active ? "bg-primary-600 text-on-primary" : "text-muted hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}

function FilterCheckbox({ checked, onChange, label, color }: { checked: boolean; onChange: () => void; label: string; color?: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={clsx(
        "flex items-center gap-2 px-2 py-1 rounded text-xs font-body-medium transition-colors cursor-pointer text-left w-full",
        checked ? "bg-surface-active text-primary" : "text-secondary-text hover:bg-surface-hover",
      )}
    >
      {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />}
      {label}
    </button>
  );
}
