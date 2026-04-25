import axios from "axios";
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
    if (axios.isAxiosError(error) && error.response) {
      if (
        error.response.status === 403 &&
        error.response.data?.message === "Email not verified"
      ) {
        toast.warning(t("verification.banner"), {
          toastId: "email-not-verified",
        });
      }

      const e: HttpResponseError = {
        message:
          error.response.data?.message ||
          error.response.statusText ||
          "Request error",
        status: error.response.status,
      };
      return Promise.reject(e);
    }

    toast.error(t("network.connectionLost"), {
      toastId: "network-error",
    });

    return Promise.reject({
      message: t("network.connectionLost"),
      status: 0,
    } as HttpResponseError);
  },
);

export { http };
