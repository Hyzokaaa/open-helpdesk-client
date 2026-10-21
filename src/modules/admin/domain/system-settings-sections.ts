import { MenuSection } from "@modules/settings/domain/settings-menu";

/** The system settings menu, for system admins: section ids are part of the URL (`/admin/settings/:section`). */
export type SystemSettingsSectionId = "workspace-creation" | "email-sending" | "email-receiving" | "audit-retention";

export type SystemSettingsGroupId = "workspaces" | "email" | "data";

export const SYSTEM_SETTINGS_GROUPS: SystemSettingsGroupId[] = ["workspaces", "email", "data"];

/** In menu order. Every system admin sees them all. */
export const SYSTEM_SETTINGS_SECTIONS: MenuSection<SystemSettingsSectionId>[] = [
  {
    id: "workspace-creation",
    group: "workspaces",
    keywords: ["workspace", "espacio", "create", "crear", "self-service", "signup", "registro"],
    fields: [
      { en: "Who can create workspaces", es: "Quién puede crear espacios" },
      { en: "System admins only", es: "Solo administradores del sistema" },
      { en: "Any user", es: "Cualquier usuario" },
    ],
  },
  {
    id: "email-sending",
    group: "email",
    keywords: ["smtp", "sender", "remitente", "outgoing", "salida", "email", "correo", "notifications", "notificaciones"],
    fields: [
      { en: "SMTP server", es: "Servidor SMTP" },
      { en: "SMTP port", es: "Puerto SMTP" },
      { en: "SMTP user", es: "Usuario SMTP" },
      { en: "SMTP password", es: "Contraseña SMTP" },
      { en: "From address", es: "Dirección del remitente" },
      { en: "Encryption", es: "Cifrado" },
      { en: "Test connection", es: "Probar conexión" },
    ],
  },
  {
    id: "email-receiving",
    group: "email",
    keywords: ["imap", "inbox", "entrada", "mailbox", "buzón", "email", "correo"],
    fields: [
      { en: "Platform mailbox", es: "Buzón de la plataforma" },
      { en: "IMAP server", es: "Servidor IMAP" },
      { en: "IMAP port", es: "Puerto IMAP" },
      { en: "IMAP user", es: "Usuario IMAP" },
      { en: "Mailbox password", es: "Contraseña del buzón" },
    ],
  },
  {
    id: "audit-retention",
    group: "data",
    keywords: ["audit", "auditoría", "retention", "retención", "log", "registro"],
    fields: [
      { en: "Retention days", es: "Días de retención" },
      { en: "Keep forever", es: "Conservar siempre" },
    ],
  },
];
