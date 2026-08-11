import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: `${BASE_URL}/api/v1` });

function getStoredToken(key: "novagen_access_token" | "novagen_refresh_token") {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function setStoredTokens(access: string, refresh: string) {
  window.localStorage.setItem("novagen_access_token", access);
  window.localStorage.setItem("novagen_refresh_token", refresh);
}

export function clearStoredTokens() {
  window.localStorage.removeItem("novagen_access_token");
  window.localStorage.removeItem("novagen_refresh_token");
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken("novagen_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const refreshToken = getStoredToken("novagen_refresh_token");
      if (!refreshToken) {
        clearStoredTokens();
        return Promise.reject(error);
      }

      refreshing =
        refreshing ??
        api
          .post("/auth/refresh", { refresh_token: refreshToken })
          .then((res) => {
            setStoredTokens(res.data.access_token, res.data.refresh_token);
            return res.data.access_token as string;
          })
          .catch(() => {
            clearStoredTokens();
            return null;
          })
          .finally(() => {
            refreshing = null;
          });

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    return Promise.reject(error);
  }
);

export { setStoredTokens, getStoredToken };
