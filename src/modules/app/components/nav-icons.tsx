import type { ReactElement } from "react";
import clsx from "clsx";

/** Icons of the app sidebar: 20×20 viewBox, 1.5 stroke, currentColor. Drawn for this project. */
export type NavIconName =
  | "tickets"
  | "myStats"
  | "members"
  | "contacts"
  | "invitations"
  | "tags"
  | "categories"
  | "departments"
  | "organizations"
  | "projects"
  | "cannedResponses"
  | "emailRules"
  | "customFields"
  | "knowledgeBase"
  | "settings"
  | "reports"
  | "auditLog"
  | "account"
  | "security"
  | "preferences"
  | "notifications"
  | "deletedWorkspaces"
  | "adminUsers"
  | "adminWorkspaces"
  | "adminBranding"
  | "adminAnalytics"
  | "adminSettings"
  | "adminUpdates"
  | "adminLogs"
  | "blockUser"
  | "blockAdmin"
  | "extension"
  | "sidebarCollapse"
  | "sidebarExpand"
  | "signOut";

const GEAR = (
  <>
    <path d="M15.45 8.32L17.45 8.49L17.45 11.51L15.45 11.68L15.04 12.66L16.33 14.2L14.2 16.33L12.66 15.04L11.68 15.45L11.51 17.45L8.49 17.45L8.32 15.45L7.34 15.04L5.8 16.33L3.67 14.2L4.96 12.66L4.55 11.68L2.55 11.51L2.55 8.49L4.55 8.32L4.96 7.34L3.67 5.8L5.8 3.67L7.34 4.96L8.32 4.55L8.49 2.55L11.51 2.55L11.68 4.55L12.66 4.96L14.2 3.67L16.33 5.8L15.04 7.34Z"/>
    <circle cx="10" cy="10" r="2.5"/>
  </>
);

const PATHS: Record<NavIconName, ReactElement> = {
  tickets: (
    <>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h11A1.5 1.5 0 0 1 17 6.5V8a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 13.5V12a2 2 0 0 0 0-4Z"/>
      <path d="M12.5 5.5v1.5M12.5 9.25v1.5M12.5 13v1.5"/>
    </>
  ),
  myStats: (
    <>
      <path d="M3 16.5h14"/>
      <path d="M6 13.5v-4M10 13.5v-9M14 13.5v-6"/>
    </>
  ),
  members: (
    <>
      <circle cx="7.5" cy="7" r="2.75"/>
      <path d="M2.5 16.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>
      <path d="M13 4.4a2.75 2.75 0 0 1 0 5.2"/>
      <path d="M14.75 12.6c1.5.5 2.4 1.7 2.75 3.9"/>
    </>
  ),
  contacts: (
    <>
      <rect x="4.5" y="2.5" width="12" height="15" rx="2"/>
      <circle cx="10.5" cy="8.25" r="2.25"/>
      <path d="M7.25 13.75c.5-1.5 1.7-2.35 3.25-2.35s2.75.85 3.25 2.35"/>
      <path d="M3 6h3M3 10h3M3 14h3"/>
    </>
  ),
  invitations: (
    <>
      <path d="M17 10V6.5A1.5 1.5 0 0 0 15.5 5h-11A1.5 1.5 0 0 0 3 6.5v7A1.5 1.5 0 0 0 4.5 15H11"/>
      <path d="m3.5 6 6.5 4.5L16.5 6"/>
      <path d="M15.5 12.5v5M13 15h5"/>
    </>
  ),
  tags: (
    <>
      <path d="M3 4.5v4.38a1.5 1.5 0 0 0 .44 1.06l6.62 6.62a1.5 1.5 0 0 0 2.12 0l4.38-4.38a1.5 1.5 0 0 0 0-2.12L9.94 3.44A1.5 1.5 0 0 0 8.88 3H4.5A1.5 1.5 0 0 0 3 4.5Z"/>
      <circle cx="6.75" cy="6.75" r="1.25"/>
    </>
  ),
  categories: (
    <>
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.25"/>
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.25"/>
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.25"/>
      <circle cx="14.25" cy="14.25" r="2.75"/>
    </>
  ),
  departments: (
    <>
      <rect x="7.5" y="2.5" width="5" height="4" rx="1"/>
      <rect x="2.5" y="13.5" width="5" height="4" rx="1"/>
      <rect x="12.5" y="13.5" width="5" height="4" rx="1"/>
      <path d="M10 6.5v4M5 13.5v-2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/>
    </>
  ),
  organizations: (
    <>
      <path d="M3.5 17V4.5A1.5 1.5 0 0 1 5 3h6a1.5 1.5 0 0 1 1.5 1.5V17"/>
      <path d="M12.5 8H15a1.5 1.5 0 0 1 1.5 1.5V17"/>
      <path d="M2 17h16"/>
      <path d="M6.5 6.5h3M6.5 9.5h3M6.5 12.5h3"/>
    </>
  ),
  projects: <path d="M2.5 6A1.5 1.5 0 0 1 4 4.5h3.4l1.6 2h7a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 16 16H4a1.5 1.5 0 0 1-1.5-1.5Z"/>,
  cannedResponses: (
    <>
      <path d="M4 3.5h12A1.5 1.5 0 0 1 17.5 5v8a1.5 1.5 0 0 1-1.5 1.5H8l-4 3v-3A1.5 1.5 0 0 1 2.5 13V5A1.5 1.5 0 0 1 4 3.5Z"/>
      <path d="m10.75 6-2.25 3h3l-2.25 3"/>
    </>
  ),
  emailRules: <path d="M3 4h14l-5.5 6.5V16l-3 1.5v-7Z"/>,
  customFields: (
    <>
      <rect x="2.5" y="5.5" width="15" height="9" rx="1.5"/>
      <path d="M6.5 8v4M5.25 8h2.5M5.25 12h2.5"/>
    </>
  ),
  knowledgeBase: (
    <>
      <path d="M10 5.5C8.6 4.4 6.6 4 3 4v11c3.6 0 5.6.4 7 1.5 1.4-1.1 3.4-1.5 7-1.5V4c-3.6 0-5.6.4-7 1.5Z"/>
      <path d="M10 5.5v11"/>
    </>
  ),
  settings: GEAR,
  reports: (
    <>
      <path d="M10 3a7 7 0 1 0 7 7h-7Z"/>
      <path d="M12.5 2.5a5 5 0 0 1 5 5h-5Z"/>
    </>
  ),
  auditLog: (
    <>
      <path d="M3 10a7 7 0 1 0 2.05-4.95L3 7"/>
      <path d="M3 3.5V7h3.5"/>
      <path d="M10 6.5V10l2.5 1.5"/>
    </>
  ),
  account: (
    <>
      <circle cx="10" cy="10" r="7.5"/>
      <circle cx="10" cy="8.5" r="2.5"/>
      <path d="M5.2 15.3c1-1.75 2.7-2.8 4.8-2.8s3.8 1.05 4.8 2.8"/>
    </>
  ),
  security: (
    <>
      <path d="M10 2.5 4 4.75v4.5c0 3.75 2.55 6.55 6 8.25 3.45-1.7 6-4.5 6-8.25v-4.5Z"/>
      <path d="m7.5 10 1.75 1.75 3.5-3.5"/>
    </>
  ),
  preferences: (
    <>
      <path d="M3 5.5h8M15 5.5h2M3 14.5h2M9 14.5h8"/>
      <circle cx="13" cy="5.5" r="2"/>
      <circle cx="7" cy="14.5" r="2"/>
    </>
  ),
  notifications: (
    <>
      <path d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5.5 2 6H3c.5-.5 2-2 2-6Z"/>
      <path d="M8.25 17a1.9 1.9 0 0 0 3.5 0"/>
    </>
  ),
  deletedWorkspaces: (
    <>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 5.5l.8 10.6a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L15 5.5"/>
      <path d="M8.5 9v5M11.5 9v5"/>
    </>
  ),
  adminUsers: (
    <>
      <rect x="2.5" y="4" width="15" height="12" rx="1.5"/>
      <circle cx="7.5" cy="9" r="1.75"/>
      <path d="M4.75 13.25c.4-1.1 1.4-1.75 2.75-1.75s2.35.65 2.75 1.75"/>
      <path d="M12.5 8.5h2.5M12.5 11.5h2.5"/>
    </>
  ),
  adminWorkspaces: (
    <>
      <path d="m10 2.5 7.5 4-7.5 4-7.5-4Z"/>
      <path d="m2.5 10 7.5 4 7.5-4"/>
      <path d="m2.5 13.5 7.5 4 7.5-4"/>
    </>
  ),
  adminBranding: (
    <>
      <path d="M10 2.5a7.5 7.5 0 0 0 0 15c.9 0 1.5-.6 1.5-1.4 0-.9-.75-1.3-.75-2.1 0-.8.7-1.5 1.5-1.5H14a3.5 3.5 0 0 0 3.5-3.5c0-3.6-3.4-6.5-7.5-6.5Z"/>
      <circle cx="6.5" cy="9.5" r="1"/>
      <circle cx="8.75" cy="6.25" r="1"/>
      <circle cx="12.75" cy="6.5" r="1"/>
    </>
  ),
  adminAnalytics: (
    <>
      <path d="M3 16.5h14"/>
      <path d="m4 12.5 4-4 3 3 5.5-6"/>
      <path d="M13.5 5.5h3v3"/>
    </>
  ),
  adminSettings: GEAR,
  adminUpdates: (
    <>
      <path d="M16.5 10A6.5 6.5 0 0 1 5 14.2"/>
      <path d="M3.5 10A6.5 6.5 0 0 1 15 5.8"/>
      <path d="M15.5 2.5V6H12"/>
      <path d="M4.5 17.5V14H8"/>
    </>
  ),
  adminLogs: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="1.5"/>
      <path d="m6 8 2.5 2L6 12M10.5 12.5h3.5"/>
    </>
  ),
  blockUser: (
    <>
      <circle cx="8.5" cy="6.75" r="3"/>
      <path d="M3 17c.6-3 2.7-4.75 5.5-4.75.9 0 1.7.15 2.4.5"/>
      <circle cx="15" cy="15" r="1.75"/>
      <path d="M15 11.5v1.75M15 16.75v1.75M11.5 15h1.75M16.75 15h1.75"/>
    </>
  ),
  blockAdmin: (
    <>
      <circle cx="7" cy="13" r="3.5"/>
      <path d="m9.5 10.5 7-7M14 6l2 2M11.75 8.25l1.5 1.5"/>
    </>
  ),
  extension: (
    <>
      <rect x="3.5" y="3.5" width="13" height="13" rx="3.5"/>
      <circle cx="10" cy="10" r="1.5"/>
    </>
  ),
  sidebarCollapse: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2"/>
      <path d="M7.5 3.5v13"/>
      <path d="m13 8-2 2 2 2"/>
    </>
  ),
  signOut: (
    <>
      <path d="M8 3.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h3"/>
      <path d="M12.5 13.5 16 10l-3.5-3.5"/>
      <path d="M16 10H8"/>
    </>
  ),
  sidebarExpand: (
    <>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2"/>
      <path d="M7.5 3.5v13"/>
      <path d="m11 8 2 2-2 2"/>
    </>
  ),
};

interface Props {
  /** Without a name, or with an unknown one (an extension item without its own icon), draws the generic one. */
  name?: NavIconName | null;
  className?: string;
}

export default function NavIcon({ name, className }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={clsx("w-[18px] h-[18px] shrink-0", className)}
    >
      {(name && PATHS[name]) || PATHS.extension}
    </svg>
  );
}
