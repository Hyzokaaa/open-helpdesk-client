import clsx from "clsx";
import Select from "@modules/app/modules/ui/components/Select/Select";
import { TicketFilters } from "../services/ticket.service";
import { PRIORITIES, STATUSES } from "../domain/ticket-enums";
import { Tag } from "@modules/tag/services/tag.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import type { Tab } from "../hooks/useTicketFilters";

interface TicketFilterBarProps {
  tab: Tab;
  filters: TicketFilters;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilters>>;
  filterTagIds: string[];
  setFilterTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  tags: Tag[];
  tagDropdownOpen: boolean;
  setTagDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function TicketFilterBar({
  tab,
  filters,
  setFilters,
  filterTagIds,
  setFilterTagIds,
  tags,
  tagDropdownOpen,
  setTagDropdownOpen,
  tagDropdownRef,
}: TicketFilterBarProps) {
  const { t, tEnum } = useTranslation();

  return (
    <>
      {tab === "active" && (
        <div className="w-40">
          <Select
            options={["all", ...STATUSES.filter((s) => s !== "resolved" && s !== "discarded")]}
            label={(s) => (s === "all" ? t("tickets.allStatuses") : tEnum("status", s))}
            value={(s) => s === (filters.status || "all")}
            onChange={(s) =>
              setFilters({
                ...filters,
                status: s === "all" ? undefined : s,
                page: 1,
              })
            }
            placeholder="Status"
          />
        </div>
      )}
      <div className="w-40">
        <Select
          options={["all", ...PRIORITIES]}
          label={(p) => (p === "all" ? t("tickets.allPriorities") : tEnum("priority", p))}
          value={(p) => p === (filters.priority || "all")}
          onChange={(p) =>
            setFilters({
              ...filters,
              priority: p === "all" ? undefined : p,
              page: 1,
            })
          }
          placeholder="Priority"
        />
      </div>

      {tags.length > 0 && (
        <div ref={tagDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            className={clsx(
              "h-max px-3 py-1 rounded-input border-input text-sm text-left cursor-pointer flex items-center gap-2 transition-all",
              filterTagIds.length > 0
                ? "bg-surface-active border-primary-300 text-primary"
                : "bg-surface text-subtle",
            )}
          >
            <span>Tags</span>
            {filterTagIds.length > 0 && (
              <span className="bg-primary-600 text-on-primary text-exs rounded-full w-4 h-4 flex items-center justify-center">
                {filterTagIds.length}
              </span>
            )}
            <span className="text-xs ml-1">▼</span>
          </button>

          {tagDropdownOpen && (
            <div className="absolute z-50 mt-1 bg-surface border border-border-input rounded-lg shadow-lg p-3 w-56">
              <p className="text-exs text-subtle font-body-medium mb-2 uppercase">
                {t("tickets.filterByTags")}
              </p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-auto">
                {tags.map((tag) => {
                  const selected = filterTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const ids = selected
                          ? filterTagIds.filter((id) => id !== tag.id)
                          : [...filterTagIds, tag.id];
                        setFilterTagIds(ids);
                        setFilters({ ...filters, page: 1 });
                      }}
                      className={clsx(
                        "flex items-center gap-2 px-2 py-1.5 rounded text-xs font-body-medium transition-colors cursor-pointer text-left",
                        selected
                          ? "bg-surface-active text-primary"
                          : "text-secondary-text hover:bg-surface-hover",
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || "#6366f1" }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              {filterTagIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterTagIds([]);
                    setFilters({ ...filters, page: 1 });
                  }}
                  className="text-exs text-subtle hover:text-secondary-text mt-2 cursor-pointer"
                >
                  {t("tickets.clearAll")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
