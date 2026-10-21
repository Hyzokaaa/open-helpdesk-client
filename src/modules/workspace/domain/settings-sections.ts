/** The workspace settings menu: its sections, how they are grouped and who sees each one. */
import { MenuSection, MenuSearchResult, MenuView, SettingsField, resolveMenuView, searchMenu } from "@modules/settings/domain/settings-menu";

export type { SettingsField };
export type SettingsSectionId =
  | "general"
  | "mailboxes"
  | "email-sender"
  | "email-language"
  | "ticket-references"
  | "sla"
  | "portal"
  | "branding"
  | "custom-domain"
  | "api-keys"
  | "webhooks"
  | "analytics"
  | "audit-retention"
  | "data-migration"
  | "delete";

export type SettingsGroupId = "workspace" | "email" | "tickets" | "portal" | "integrations" | "data" | "danger";

/** What decides which sections someone sees: the same checks the page always made. */
export interface SettingsAccess {
  isSystemAdmin: boolean;
  isOwner: boolean;
  canManageSettings: boolean;
  canManageAnalytics: boolean;
}

export interface SettingsSection {
  id: SettingsSectionId;
  group: SettingsGroupId;
  /** Extra words the settings search matches, in both languages, beyond the section's title. */
  keywords: string[];
  visible: (access: SettingsAccess) => boolean;
}

const settings = (a: SettingsAccess) => a.canManageSettings;

/** In menu order. */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", group: "workspace", keywords: ["name", "nombre", "description", "descripción", "slug", "members", "miembros"], visible: (a) => a.isSystemAdmin || a.isOwner || a.canManageSettings || a.canManageAnalytics },
  { id: "mailboxes", group: "email", keywords: ["imap", "inbox", "entrada", "buzón", "mailbox", "email", "correo"], visible: settings },
  { id: "email-sender", group: "email", keywords: ["smtp", "sender", "remitente", "salida", "outgoing", "email", "correo"], visible: settings },
  { id: "email-language", group: "email", keywords: ["language", "idioma", "email", "correo"], visible: settings },
  { id: "ticket-references", group: "tickets", keywords: ["reference", "referencia", "prefix", "prefijo", "number", "número"], visible: settings },
  { id: "sla", group: "tickets", keywords: ["sla", "response", "respuesta", "resolution", "resolución"], visible: settings },
  { id: "portal", group: "portal", keywords: ["portal", "customers", "clientes", "knowledge base", "base de conocimiento", "kb", "widget"], visible: settings },
  { id: "branding", group: "portal", keywords: ["brand", "marca", "logo", "palette", "paleta", "color"], visible: settings },
  { id: "custom-domain", group: "portal", keywords: ["domain", "dominio", "dns", "cname"], visible: settings },
  { id: "api-keys", group: "integrations", keywords: ["api", "key", "clave", "token"], visible: settings },
  { id: "webhooks", group: "integrations", keywords: ["webhook", "events", "eventos"], visible: settings },
  { id: "analytics", group: "integrations", keywords: ["matomo", "analytics", "analítica", "tracking"], visible: (a) => a.canManageAnalytics },
  { id: "audit-retention", group: "data", keywords: ["audit", "auditoría", "retention", "retención", "log", "registro"], visible: settings },
  { id: "data-migration", group: "data", keywords: ["export", "exportar", "import", "importar", "migration", "migración", "backup"], visible: settings },
  { id: "delete", group: "danger", keywords: ["delete", "eliminar", "borrar", "danger", "peligro"], visible: (a) => a.isSystemAdmin || a.isOwner },
];

/** The sections someone may see, in menu order, with what each holds for the search. */
export function visibleSettingsSections(access: SettingsAccess): MenuSection<SettingsSectionId>[] {
  return SETTINGS_SECTIONS.filter((s) => s.visible(access)).map(({ id, group, keywords }) => ({ id, group, keywords, fields: SETTINGS_FIELDS[id] }));
}

export type SettingsView = MenuView<SettingsSectionId>;

/** What the settings page shows for a URL; see resolveMenuView. */
export function resolveSettingsView(requested: string | undefined, access: SettingsAccess, wide: boolean): SettingsView {
  return resolveMenuView(requested, visibleSettingsSections(access), wide);
}

/**
 * What each section holds, for the search: other sections are not loaded while one is open, so
 * their fields cannot be read from the page and are listed here.
 */
export const SETTINGS_FIELDS: Record<SettingsSectionId, SettingsField[]> = {
  general: [
    { en: "Name", es: "Nombre" },
    { en: "Description", es: "Descripción" },
    { en: "Slug", es: "Slug" },
    { en: "Members", es: "Miembros" },
  ],
  mailboxes: [
    { en: "IMAP server", es: "Servidor IMAP" },
    { en: "IMAP port", es: "Puerto IMAP" },
    { en: "IMAP user", es: "Usuario IMAP" },
    { en: "Mailbox password", es: "Contraseña del buzón" },
    { en: "Folder", es: "Carpeta" },
    { en: "After processing", es: "Tras procesar" },
    { en: "Pause mailbox", es: "Pausar buzón" },
  ],
  "email-sender": [
    { en: "From name", es: "Nombre del remitente" },
    { en: "From address", es: "Dirección del remitente" },
    { en: "SMTP user", es: "Usuario SMTP" },
    { en: "SMTP password", es: "Contraseña SMTP" },
    { en: "SMTP server", es: "Servidor SMTP" },
    { en: "SMTP port", es: "Puerto SMTP" },
    { en: "Encryption", es: "Cifrado" },
    { en: "Test connection", es: "Probar conexión" },
  ],
  "email-language": [
    { en: "Language of emails", es: "Idioma de los correos" },
  ],
  "ticket-references": [
    { en: "Reference style", es: "Estilo de referencia" },
    { en: "Prefix", es: "Prefijo" },
    { en: "Sequential or random", es: "Secuencial o aleatoria" },
  ],
  sla: [
    { en: "First response", es: "Primera respuesta" },
    { en: "Resolution time", es: "Tiempo de resolución" },
    { en: "Targets per priority", es: "Objetivos por prioridad" },
  ],
  portal: [
    { en: "Open or close the portal", es: "Abrir o cerrar el portal" },
    { en: "Public knowledge base", es: "Base de conocimiento pública" },
    { en: "Portal address", es: "Dirección del portal" },
    { en: "Embedded widget", es: "Widget incrustado" },
  ],
  branding: [
    { en: "Color palette", es: "Paleta de colores" },
    { en: "App name", es: "Nombre de la app" },
    { en: "Subtitle", es: "Subtítulo" },
    { en: "Logo", es: "Logo" },
    { en: "Icon", es: "Icono" },
  ],
  "custom-domain": [
    { en: "Domain", es: "Dominio" },
    { en: "DNS verification", es: "Verificación DNS" },
    { en: "CNAME record", es: "Registro CNAME" },
  ],
  "api-keys": [
    { en: "Create API key", es: "Crear clave API" },
    { en: "Permissions", es: "Permisos" },
    { en: "Expiry", es: "Caducidad" },
  ],
  webhooks: [
    { en: "Webhook URL", es: "URL del webhook" },
    { en: "Events", es: "Eventos" },
    { en: "Signing secret", es: "Secreto de firma" },
  ],
  analytics: [
    { en: "Matomo address", es: "Dirección de Matomo" },
    { en: "Site ID", es: "ID del sitio" },
  ],
  "audit-retention": [
    { en: "Retention days", es: "Días de retención" },
    { en: "Keep forever", es: "Conservar siempre" },
  ],
  "data-migration": [
    { en: "Export data", es: "Exportar datos" },
    { en: "Export link", es: "Enlace de exportación" },
    { en: "Import from file", es: "Importar desde archivo" },
    { en: "Import from link", es: "Importar desde enlace" },
  ],
  delete: [
    { en: "Delete workspace", es: "Eliminar espacio" },
  ],
};

export type SettingsSearchResult = MenuSearchResult<SettingsSectionId>;

/** What a search finds among the sections someone may see; see searchMenu. */
export function searchSettings(
  sections: MenuSection<SettingsSectionId>[],
  query: string,
  title: (id: SettingsSectionId) => string,
  lang: string,
  limit = 8,
): SettingsSearchResult[] {
  return searchMenu(sections, query, title, lang, limit);
}
