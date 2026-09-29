import axios, { type InternalAxiosRequestConfig } from "axios";
import { createElement } from "react";
import { toast } from "react-toastify";
import { API_URL } from "@modules/app/domain/constants/env";
import { t } from "@modules/app/i18n/translations";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import { clearSession, saveSession, type SessionTokens } from "@modules/app/domain/core/session";

export interface HttpResponseError {
  message: string;
  status: number;
  handled?: boolean;
}

const http = axios.create({
  baseURL: API_URL,
});

let sessionExpired = false;
let renewing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = LocalStorage.get(LOCAL_STORAGE_KEY.REFRESH_TOKEN);
  if (!refreshToken) return false;
  try {
    // Plain axios: a failing refresh must not go through these interceptors again
    const res = await axios.post<SessionTokens>(`${API_URL}/auth/refresh`, { refreshToken });
    saveSession(res.data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a fresh access token after a 401. Requests failing together share one refresh, and if
 * the stored token already differs from the one the request sent, another request or tab
 * renewed it meanwhile and a retry is enough.
 */
function renewAccessToken(config: InternalAxiosRequestConfig): Promise<boolean> {
  const stored = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);
  if (stored && config.headers.get("Authorization") !== `Bearer ${stored}`) return Promise.resolve(true);
  renewing ??= refreshSession().finally(() => { renewing = null; });
  return renewing;
}

/**
 * The session could not be renewed: it expired, was signed out elsewhere or revoked. Drop it
 * and, inside the dashboard, send the user to sign in again, back to where they were. Public
 * pages (portal, login…) just lose the stale tokens and stay put.
 */
function handleExpiredSession(): void {
  if (sessionExpired) return; // several requests fail at once
  sessionExpired = true;
  clearSession();

  const { pathname, search } = window.location;
  if (!pathname.startsWith("/dashboard")) {
    sessionExpired = false;
    return;
  }
  const redirect = encodeURIComponent(pathname + search);
  // A full navigation also resets in-memory state such as the user and the permissions cache
  window.location.assign(`/login?expired=1&redirect=${redirect}`);
}

http.interceptors.request.use(
  (config) => {
    const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }

    config.headers['X-Frontend-URL'] = window.location.origin;

    return config;
  },
  (error) => Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const silent = error.config?.headers?.['X-Silent-Errors'] === 'true';

    if (axios.isAxiosError(error) && error.response) {
      let handled = false;

      // Only a request that carried a token can mean it expired; /auth/* answers 401 for a
      // wrong password, which must stay on the login form.
      const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const sentToken = config?.headers?.has("Authorization") ?? false;
      const isAuthEndpoint = config?.url?.startsWith("/auth/") ?? false;
      if (config && error.response.status === 401 && sentToken && !isAuthEndpoint) {
        if (!config._retried && await renewAccessToken(config)) {
          config._retried = true;
          return http(config); // the request interceptor picks up the new token
        }
        handleExpiredSession();
        handled = true;
      }

      if (!silent && error.response.status === 403) {
        if (error.response.data?.message === "Email not verified") {
          toast.warning(t("verification.banner"), {
            toastId: "email-not-verified",
          });
          handled = true;
        }

        if (
          typeof error.response.data?.message === "string" &&
          error.response.data.message.includes("Upgrade")
        ) {
          const code = error.response.data.errorCode || "PLAN_LIMIT";
          toast.warning(`${t("planLimit.featureNotAvailable")} (${code})`, { toastId: "plan-limit" });
          handled = true;
        }
      }

      if (!silent && error.response.status === 503) {
        toast.error(t("network.serviceUnavailable"), {
          toastId: "service-unavailable",
        });
        handled = true;
      }

      const rawMessage = error.response.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(", ")
        : rawMessage || error.response.statusText || "Request error";

      const e: HttpResponseError = {
        message,
        status: error.response.status,
        handled,
      };
      return Promise.reject(e);
    }

    if (!silent) {
      toast.error(t("network.connectionLost"), {
        toastId: "network-error",
      });
    }

    return Promise.reject({
      message: t("network.connectionLost"),
      status: 0,
    } as HttpResponseError);
  },
);

export { http };
