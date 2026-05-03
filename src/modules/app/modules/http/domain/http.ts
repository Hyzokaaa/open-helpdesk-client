import axios from "axios";
import { createElement } from "react";
import { toast } from "react-toastify";
import { API_URL } from "@modules/app/domain/constants/env";
import { t } from "@modules/app/i18n/translations";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";

export interface HttpResponseError {
  message: string;
  status: number;
  handled?: boolean;
}

const http = axios.create({
  baseURL: API_URL,
});

http.interceptors.request.use(
  (config) => {
    const token = LocalStorage.get(LOCAL_STORAGE_KEY.ACCESS_TOKEN);

    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const silent = error.config?.headers?.['X-Silent-Errors'] === 'true';

    if (axios.isAxiosError(error) && error.response) {
      let handled = false;

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
          const msg = error.response.data.message;
          toast.warning(
            ({ closeToast }) =>
              createElement('div', null,
                createElement('p', null, msg),
                createElement('a', {
                  href: '/dashboard/settings/billing',
                  onClick: closeToast,
                  style: { color: '#60a5fa', textDecoration: 'underline', fontSize: '0.85em' },
                }, t("planLimit.viewPlans")),
              ),
            { toastId: "plan-limit" },
          );
          handled = true;
        }
      }

      const e: HttpResponseError = {
        message:
          error.response.data?.message ||
          error.response.statusText ||
          "Request error",
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
