/** One slot of a page list: a page number, or a gap standing for two or more hidden pages. */
export type PageSlot = number | "gap";

export const PAGE_SIZES = [20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, limit)));
}

/**
 * The pages to show: all of them up to seven; otherwise the first, the last and the current one
 * with its neighbours. The list keeps the same width at both ends, and a gap only ever hides two
 * pages or more (a single hidden page is shown instead).
 */
export function getPageRange(page: number, pages: number): PageSlot[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  let start = Math.max(2, page - 1);
  let end = Math.min(pages - 1, page + 1);
  if (page <= 3) { start = 2; end = 5; }
  if (page >= pages - 2) { start = pages - 4; end = pages - 1; }
  const slots: PageSlot[] = [1];
  if (start > 2) slots.push(start === 3 ? 2 : "gap");
  for (let i = start; i <= end; i++) slots.push(i);
  if (end < pages - 1) slots.push(end === pages - 2 ? pages - 1 : "gap");
  slots.push(pages);
  return slots;
}

/** The first and last item shown on a page, counting from 1 ("41–60 of 172"). */
export function pageItemRange(page: number, limit: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  return { from: (page - 1) * limit + 1, to: Math.min(page * limit, total) };
}

/** A page that exists for this total: after a bulk delete on the last page, the new last page. */
export function clampPage(page: number, total: number, limit: number): number {
  return Math.min(Math.max(1, page), totalPages(total, limit));
}

/** The page from the address (`?page=`), or 1 for anything that is not a whole number above 0. */
export function parsePageParam(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** A remembered page size, or the default for anything that is not one of the offered sizes. */
export function parsePageSize(value: string | null): number {
  const n = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

/** The page size this browser chose for a list, or the default when storage is empty or blocked. */
export function readPageSize(key: string): number {
  try {
    return parsePageSize(window.localStorage.getItem(key));
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

export function savePageSize(key: string, size: number): void {
  try {
    window.localStorage.setItem(key, String(size));
  } catch {
    // Storage can be blocked; the size then lasts until the page is left
  }
}
