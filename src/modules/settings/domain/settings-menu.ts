/**
 * A settings page with a menu and a page per section, shared by the workspace settings and the
 * system settings. Section ids are part of the URL (`…/settings/:section`) and stay stable when
 * groups are renamed or reordered; the group never goes into the URL.
 */

/** A field inside a section, named in both languages so the search finds it in either. */
export interface SettingsField {
  en: string;
  es: string;
}

export interface MenuSection<Id extends string = string> {
  id: Id;
  group: string;
  /** Extra words the search matches, in both languages, beyond the section's title. */
  keywords: string[];
  /**
   * What the section holds, for the search: other sections are not loaded while one is open, so
   * their fields cannot be read from the page and are listed here.
   */
  fields: SettingsField[];
}

/** What a settings page shows for a URL. */
export type MenuView<Id extends string = string> =
  | { kind: "section"; id: Id }
  /** The list of sections, on its own: narrow screens, where menu and section do not fit side by side. */
  | { kind: "index" }
  /** Replace the URL: with a section id, go there; with null, to the bare settings address. */
  | { kind: "redirect"; to: Id | null }
  | { kind: "none" };

/**
 * The bare settings address stays valid for good (emails already sent link to it): on a wide
 * screen it opens the first section the person may see, on a narrow one the list. An unknown
 * section, or one they may not see, goes back to the bare address instead of failing.
 */
export function resolveMenuView<Id extends string>(requested: string | undefined, visible: MenuSection<Id>[], wide: boolean): MenuView<Id> {
  if (visible.length === 0) return { kind: "none" };
  if (requested) {
    const match = visible.find((s) => s.id === requested);
    return match ? { kind: "section", id: match.id } : { kind: "redirect", to: null };
  }
  return wide ? { kind: "redirect", to: visible[0].id } : { kind: "index" };
}

/** One search result: a section, and the field in it that matched, if it was a field. */
export interface MenuSearchResult<Id extends string = string> {
  id: Id;
  field: string | null;
}

export const foldText = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const words = (query: string) => foldText(query).split(/\s+/).filter(Boolean);
const matches = (text: string, ws: string[]) => {
  const haystack = foldText(text);
  return ws.every((w) => haystack.includes(w));
};

/**
 * What a search finds, best first: sections by their title or keywords, then the fields inside
 * them, named in the person's language. A field is matched in either language, so "password"
 * still finds "Contraseña SMTP" for someone using Spanish. Accents and case do not matter, and
 * with several words every one must match.
 */
export function searchMenu<Id extends string>(
  sections: MenuSection<Id>[],
  query: string,
  title: (id: Id) => string,
  lang: string,
  limit = 8,
): MenuSearchResult<Id>[] {
  const ws = words(query);
  if (ws.length === 0) return [];
  const bySection: MenuSearchResult<Id>[] = sections
    .filter((s) => matches([title(s.id), ...s.keywords].join(" "), ws))
    .map((s) => ({ id: s.id, field: null }));
  const byField: MenuSearchResult<Id>[] = sections.flatMap((s) =>
    s.fields
      .filter((f) => matches(`${f.en} ${f.es}`, ws))
      .map((f) => ({ id: s.id, field: lang === "es" ? f.es : f.en })),
  );
  return [...bySection, ...byField].slice(0, limit);
}
