// javascript/client.js
import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TENANT_KEY = Constants.expoConfig?.extra?.TENANT_KEY;

export const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (TENANT_KEY) config.headers["X-Tenant-ID"] = TENANT_KEY;

  // Login and refresh pass skipAuth so they don't send an expired token.
  if (!config.skipAuth) {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});