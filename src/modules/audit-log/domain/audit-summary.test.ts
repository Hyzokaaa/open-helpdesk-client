import { describe, expect, it } from "vitest";
import translations from "@modules/app/i18n/translations";
import {
  commentPreview,
  describeChanges,
  emailSummary,
  metadataValueLabel,
  fieldLabel,
  formatChange,
  formatChangeValue,
  htmlToText,
  isUlid,
  resolveReference,
  type ReferenceNames,
} from "./audit-summary";

const translator = (lang: "en" | "es") => (key: string) => {
  const entry = (translations as Record<string, Record<string, string>>)[key];
  return entry ? entry[lang] ?? entry.en : key;
};
const en = translator("en");
const es = translator("es");

const DEP = "01M441QPHCT65PYMK5315F05A2";
const ORG = "01M441QPHCT65PYMK5315F05A3";
const PROJ = "01M441QPHCT65PYMK5315F05A4";

describe("HTML to text", () => {
  it("turns block tags into spaces, removes tags and decodes entities", () => {
    expect(htmlToText("<p>Primera versión</p><p>Tom &amp; Jerry &lt;3&gt; &#39;ok&#39;</p>")).toBe("Primera versión Tom & Jerry <3> 'ok'");
    expect(htmlToText("line<br/>break<ul><li>one</li><li>two</li></ul>")).toBe("line break one two");
  });

  it("keeps mentions as @Name", () => {
    expect(htmlToText("<p>Hola @[Ana Pérez](01HZX5C3V9J8Q2W4E6R8T0Y1U3)</p>")).toBe("Hola @Ana Pérez");
  });

  it("previews old HTML entries and new plain-text ones the same way, truncated", () => {
    expect(commentPreview('<p>Primera versión</p>')).toBe("Primera versión");
    expect(commentPreview("Primera versión")).toBe("Primera versión");
    expect(commentPreview(`<p>${"a".repeat(80)}</p>`)).toBe("a".repeat(50) + "...");
    expect(commentPreview(undefined)).toBe("");
  });
});

describe("field labels", () => {
  it("translates ticket fields in English and Spanish", () => {
    expect(fieldLabel("departmentId", en)).toBe("Department");
    expect(fieldLabel("departmentId", es)).toBe("Departamento");
    expect(fieldLabel("tagIds", es)).toBe("Etiquetas");
    expect(fieldLabel("priority", es)).toBe("Prioridad");
    expect(fieldLabel("name", es)).toBe("Nombre");
  });

  it("keeps the key of a field without a translation", () => {
    expect(fieldLabel("someNewField", en)).toBe("someNewField");
  });
});

describe("id to label resolution", () => {
  const names: ReferenceNames = { departmentId: new Map([[DEP, "Soporte"]]) };

  it("uses the loaded name, deleted when the data was loaded, unavailable when it was not", () => {
    expect(resolveReference("departmentId", DEP, names, en)).toBe("Soporte");
    expect(resolveReference("departmentId", ORG, names, es)).toBe("(eliminado)");
    expect(resolveReference("projectId", PROJ, names, en)).toBe("(unavailable)");
  });

  it("prefers the label stored with the entry and translates priorities", () => {
    expect(formatChangeValue("departmentId", DEP, "Support (old name)", names, en)).toBe("Support (old name)");
    expect(formatChangeValue("priority", "high", undefined, names, es)).toBe("Alta");
    expect(formatChangeValue("projectId", null, undefined, names, en)).toBe("—");
    expect(formatChangeValue("tagIds", ["t1", "t2"], undefined, { tagIds: new Map([["t1", "urgent"]]) }, en)).toBe("urgent, (deleted)");
  });

  it("never shows a raw ULID", () => {
    expect(isUlid(DEP)).toBe(true);
    expect(isUlid("hello")).toBe(false);
    expect(formatChangeValue("somethingId", DEP, undefined, {}, en)).toBe("(unavailable)");
  });
});

describe("ticket update changes", () => {
  it("describes an old entry with ids through workspace data, without a ULID", () => {
    const metadata = {
      ticketName: "No puedo acceder",
      before: { name: "No puedo acceder", priority: "low", projectId: null, departmentId: null, organizationId: null },
      after: { name: "No puedo acceder", priority: "high", projectId: PROJ, departmentId: DEP, organizationId: ORG },
    };
    const names: ReferenceNames = { departmentId: new Map([[DEP, "Soporte"]]), organizationId: new Map(), projectId: new Map([[PROJ, "Migración"]]) };
    const text = describeChanges(metadata, names, es).map(formatChange).join(", ");

    expect(text).toBe("Prioridad: Baja → Alta, Proyecto: — → Migración, Departamento: — → Soporte, Organización: — → (eliminado)");
    expect(text).not.toMatch(/[0-9A-HJKMNP-TV-Z]{26}/);
  });

  it("uses the labels captured at write time", () => {
    const metadata = {
      before: { categoryId: "c1" },
      after: { categoryId: "c2", tagIds: ["t1"] },
      beforeLabels: { categoryId: "Hardware" },
      afterLabels: { categoryId: "Software", tagIds: "urgent" },
    };
    expect(describeChanges(metadata, {}, en).map(formatChange)).toEqual(["Category: Hardware → Software", "Tags: — → urgent"]);
  });

  it("ignores unchanged fields and tag sets in another order", () => {
    const metadata = { before: { name: "a", tagIds: ["t1", "t2"] }, after: { name: "a", tagIds: ["t2", "t1"] } };
    expect(describeChanges(metadata, {}, en)).toEqual([]);
  });

  it("describes a single changed setting stored as plain values", () => {
    expect(describeChanges({ before: "en", after: "es" }, {}, en).map(formatChange)).toEqual(["en → es"]);
  });

  it("describes an analytics settings change with field names and yes/no", () => {
    const metadata = {
      before: { provider: null, serverUrl: null, siteId: null, useCookies: false, trackEvents: true },
      after: { provider: "matomo", serverUrl: "https://stats.example.org/", siteId: "3", useCookies: true, trackEvents: true },
    };
    expect(describeChanges(metadata, {}, es).map(formatChange)).toEqual([
      "Proveedor: — → matomo",
      "URL del servidor: — → https://stats.example.org/",
      "ID del sitio: — → 3",
      "Cookies: No → Sí",
    ]);
  });

  it("describes a workspace analytics change, including the share toggle", () => {
    const metadata = {
      before: { provider: null, serverUrl: null, siteId: null, useCookies: false, trackEvents: true, shareWithInstallation: true },
      after: { provider: "matomo", serverUrl: "https://matomo.acme.test/", siteId: "7", useCookies: false, trackEvents: true, shareWithInstallation: false },
    };
    expect(describeChanges(metadata, {}, en).map(formatChange)).toEqual([
      "Provider: — → matomo",
      "Server URL: — → https://matomo.acme.test/",
      "Site ID: — → 7",
      "Share usage: Yes → No",
    ]);
  });
});

describe("emailSummary", () => {
  const texts: Record<string, string> = {
    "auditLog.summary.to": "To",
    "auditLog.reason.no-email-service": "Not sent: no mail server configured",
    "auditLog.reason.send-failed": "The mail server refused or failed the send",
    "invitations.andMore": "and {count} more",
  };
  const tr = (key: string) => texts[key] ?? key;

  it("says who a sent email was for and which ticket it was about", () => {
    expect(emailSummary({ to: ["a@x.com"], ticketReference: "TK-000003", ticketName: "Printer broken", subject: "New ticket" }, false, tr))
      .toBe("To: a@x.com · TK-000003 Printer broken");
  });

  it("falls back to the subject when the email is not about a ticket", () => {
    expect(emailSummary({ to: ["a@x.com"], subject: "You've been invited to a workspace" }, false, tr))
      .toBe("To: a@x.com · You've been invited to a workspace");
  });

  it("adds why a failed email did not leave, with the server's words", () => {
    expect(emailSummary({ to: ["a@x.com", "b@x.com", "c@x.com"], ticketName: "Printer", reason: "send-failed", error: "Invalid login: 535" }, true, tr))
      .toBe("To: a@x.com, b@x.com and 1 more · Printer · The mail server refused or failed the send: Invalid login: 535");
    expect(emailSummary({ to: "a@x.com", reason: "no-email-service" }, true, tr)).toBe("To: a@x.com · Not sent: no mail server configured");
  });
});

describe("metadataValueLabel", () => {
  const tr = (key: string) => (({ "enum.priority.medium": "Media", "enum.status.open": "Abierto", "enum.role.agent": "Agente" }) as Record<string, string>)[key] ?? key;

  it("shows priority, status and role in the reader's language, and other values as stored", () => {
    expect(metadataValueLabel("priority", "medium", tr)).toBe("Media");
    expect(metadataValueLabel("status", "open", tr)).toBe("Abierto");
    expect(metadataValueLabel("role", "agent", tr)).toBe("Agente");
    expect(metadataValueLabel("name", "medium", tr)).toBe("medium");
  });
});
