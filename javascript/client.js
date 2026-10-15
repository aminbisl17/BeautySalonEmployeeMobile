// api/client.ts
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TENANT_KEY = Constants.expoConfig?.extra?.TENANT_KEY;

export const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("accessToken");

  if (TENANT_KEY) config.headers["X-Tenant-Key"] = TENANT_KEY;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});
