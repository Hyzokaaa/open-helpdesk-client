import { describe, expect, it } from "vitest";
import { resolveMenuView, searchMenu } from "@modules/settings/domain/settings-menu";
import { SYSTEM_SETTINGS_GROUPS, SYSTEM_SETTINGS_SECTIONS } from "./system-settings-sections";

describe("system settings sections", () => {
  it("opens the first section at the bare /admin/settings on a wide screen, and the list on a narrow one", () => {
    expect(resolveMenuView(undefined, SYSTEM_SETTINGS_SECTIONS, true)).toEqual({ kind: "redirect", to: "workspace-creation" });
    expect(resolveMenuView(undefined, SYSTEM_SETTINGS_SECTIONS, false)).toEqual({ kind: "index" });
  });

  it("opens a section by its address and sends an unknown one back", () => {
    expect(resolveMenuView("email-sending", SYSTEM_SETTINGS_SECTIONS, true)).toEqual({ kind: "section", id: "email-sending" });
    expect(resolveMenuView("smtp", SYSTEM_SETTINGS_SECTIONS, true)).toEqual({ kind: "redirect", to: null });
  });

  it("finds sections and their fields in either language", () => {
    const found = (q: string, lang: string) => searchMenu(SYSTEM_SETTINGS_SECTIONS, q, (id) => id, lang).map((r) => r.field ?? r.id);
    expect(found("smtp", "en")[0]).toBe("email-sending");
    expect(found("contraseña", "es")).toEqual(["Contraseña SMTP", "Contraseña del buzón"]);
    expect(found("password", "en")).toEqual(["SMTP password", "Mailbox password"]);
  });

  it("puts every section in a known group, with fields for the search", () => {
    for (const s of SYSTEM_SETTINGS_SECTIONS) {
      expect(SYSTEM_SETTINGS_GROUPS).toContain(s.group);
      expect(s.fields.length).toBeGreaterThan(0);
    }
  });
});
