export const API_URL = import.meta.env.VITE_API_URL as string || "http://localhost:3000";

export const APP_FULL_NAME = import.meta.env.VITE_APP_NAME as string || "Open Helpdesk";

const rawSubtitle = import.meta.env.VITE_APP_SUBTITLE as string || "";
const endsWithHelpdesk = APP_FULL_NAME.toLowerCase().endsWith("helpdesk");

export const APP_NAME = endsWithHelpdesk ? APP_FULL_NAME.replace(/\s*[Hh]elpdesk$/, "") : APP_FULL_NAME;
export const APP_SUBTITLE = rawSubtitle === "none" ? "" : (rawSubtitle || "Helpdesk");
