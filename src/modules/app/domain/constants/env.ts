export const API_URL = import.meta.env.VITE_API_URL as string || "http://localhost:3000";
export const APP_NAME = import.meta.env.VITE_APP_NAME as string || "Open Helpdesk";
export const APP_SUBTITLE = import.meta.env.VITE_APP_SUBTITLE === "none" ? "" : (import.meta.env.VITE_APP_SUBTITLE as string || "Helpdesk");
