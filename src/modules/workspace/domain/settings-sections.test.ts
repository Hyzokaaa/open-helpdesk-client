import { describe, expect, it } from "vitest";
import { SettingsAccess, SETTINGS_SECTIONS, SETTINGS_FIELDS, resolveSettingsView, searchSettings, visibleSettingsSections } from "./settings-sections";

const admin: SettingsAccess = { isSystemAdmin: false, isOwner: false, canManageSettings: true, canManageAnalytics: true };
const sysadmin: SettingsAccess = { isSystemAdmin: true, isOwner: false, canManageSettings: true, canManageAnalytics: true };
const analyticsOnly: SettingsAccess = { isSystemAdmin: false, isOwner: false, canManageSettings: false, canManageAnalytics: true };
const nobody: SettingsAccess = { isSystemAdmin: false, isOwner: false, canManageSettings: false, canManageAnalytics: false };

const ids = (access: SettingsAccess) => visibleSettingsSections(access).map((s) => s.id);

describe("visibleSettingsSections", () => {
  it("shows a workspace admin everything but deleting the workspace", () => {
    expect(ids(admin)).toEqual(SETTINGS_SECTIONS.map((s) => s.id).filter((id) => id !== "delete"));
  });

  it("lets the owner and a system admin delete the workspace", () => {
    expect(ids({ ...admin, isOwner: true })).toContain("delete");
    expect(ids(sysadmin)).toContain("delete");
  });

  it("shows whoever only manages analytics just General and Analytics", () => {
    expect(ids(analyticsOnly)).toEqual(["general", "analytics"]);
  });

  it("shows an owner without settings permissions what workspace it is before deleting it", () => {
    expect(ids({ ...nobody, isOwner: true })).toEqual(["general", "delete"]);
  });

  it("shows nothing to someone who may not manage any setting", () => {
    expect(ids(nobody)).toEqual([]);
  });
});

describe("resolveSettingsView", () => {
  it("opens the first section on a wide screen at the bare /settings, which old emails link to", () => {
    expect(resolveSettingsView(undefined, admin, true)).toEqual({ kind: "redirect", to: "general" });
    expect(resolveSettingsView(undefined, analyticsOnly, true)).toEqual({ kind: "redirect", to: "general" });
  });

  it("shows the list of sections on a narrow screen at the bare /settings", () => {
    expect(resolveSettingsView(undefined, admin, false)).toEqual({ kind: "index" });
  });

  it("opens a section the person may see, on any screen", () => {
    expect(resolveSettingsView("mailboxes", admin, true)).toEqual({ kind: "section", id: "mailboxes" });
    expect(resolveSettingsView("mailboxes", admin, false)).toEqual({ kind: "section", id: "mailboxes" });
  });

  it("goes back to /settings for an unknown section", () => {
    expect(resolveSettingsView("nope", admin, true)).toEqual({ kind: "redirect", to: null });
  });

  it("goes back to /settings for a section the person may not see, also by URL", () => {
    expect(resolveSettingsView("delete", admin, true)).toEqual({ kind: "redirect", to: null });
    expect(resolveSettingsView("mailboxes", analyticsOnly, false)).toEqual({ kind: "redirect", to: null });
  });

  it("says there is nothing to show to someone without any setting", () => {
    expect(resolveSettingsView(undefined, nobody, true)).toEqual({ kind: "none" });
    expect(resolveSettingsView("general", nobody, false)).toEqual({ kind: "none" });
  });
});

describe("searchSettings", () => {
  const sections = visibleSettingsSections(admin);
  const titles: Record<string, string> = { "email-sender": "Remitente de salida", mailboxes: "Buzones de entrada", branding: "Marca y colores" };
  const title = (id: string) => titles[id] ?? id;
  const found = (q: string, lang = "es") => searchSettings(sections, q, title, lang).map((r) => (r.field ? `${r.field} · ${r.id}` : r.id));

  it("finds a section by a technical word", () => {
    expect(found("smtp")[0]).toBe("email-sender");
    expect(found("IMAP")[0]).toBe("mailboxes");
  });

  it("finds a field inside a section, named in the person's language", () => {
    expect(found("logo")).toContain("Logo · branding");
    expect(found("prefijo")).toContain("Prefijo · ticket-references");
    expect(found("prefix", "en")).toContain("Prefix · ticket-references");
  });

  it("matches a field in either language and ignores accents and case", () => {
    expect(found("password")).toEqual(expect.arrayContaining(["Contraseña SMTP · email-sender", "Contraseña del buzón · mailboxes"]));
    expect(found("CONTRASENA")).toContain("Contraseña SMTP · email-sender");
  });

  it("lists sections before fields, and needs every word", () => {
    const results = found("correo salida");
    expect(results[0]).toBe("email-sender");
  });

  it("only searches what the person may see", () => {
    const limited = searchSettings(visibleSettingsSections({ ...admin, canManageSettings: false }), "smtp", title, "en");
    expect(limited).toEqual([]);
  });

  it("finds nothing for an empty search", () => {
    expect(found("   ")).toEqual([]);
  });

  it("lists fields for every section", () => {
    for (const s of sections) expect(SETTINGS_FIELDS[s.id].length).toBeGreaterThan(0);
  });
});
