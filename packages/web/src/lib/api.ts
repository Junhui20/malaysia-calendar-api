import { MyCalClient } from "@mycal/sdk";

const baseUrl =
  typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_API_URL
    ? import.meta.env.PUBLIC_API_URL
    : "https://mycal-api.huijun00100101.workers.dev/v1";

export const apiClient = new MyCalClient({ baseUrl });
export const apiBaseUrl = baseUrl;
