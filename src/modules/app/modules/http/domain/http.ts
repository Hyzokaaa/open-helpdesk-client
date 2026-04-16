import axios from "axios";
import { API_URL } from "@modules/app/domain/constants/env";
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
      const e: HttpResponseError = {
        message:
          error.response.data?.message ||
          error.response.statusText ||
          "Error en la petición",
        status: error.response.status,
      };
      return Promise.reject(e);
    }

    return Promise.reject({
      message: "No se pudo conectar al servidor",
      status: 500,
    } as HttpResponseError);
  },
);

export { http };
