import axios from "axios";
import * as SecureStore from "expo-secure-store";

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Decodes base64url without atob/Buffer, so it works on any React Native version
function base64UrlDecode(input) {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";

  let out = "";
  let buffer = 0;
  let bits = 0;

  for (const c of s) {
    if (c === "=") break;
    const v = B64.indexOf(c);
    if (v < 0) continue;

    buffer = (buffer << 6) | v;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }
  return out;
}

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    return JSON.parse(base64UrlDecode(part));
  } catch {
    return null;
  }
}

// Cached so we don't hit SecureStore and decode on every request
let cachedTenantKey = null;

export async function getTenantKey() {
  if (cachedTenantKey) return cachedTenantKey;

  const token = await SecureStore.getItemAsync("tenantToken");
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  cachedTenantKey = payload?.TenantKey ?? null;
  return cachedTenantKey;
}

// Call after saving or deleting the tenant token
export function clearTenantCache() {
  cachedTenantKey = null;
}

export const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const tenantKey = await getTenantKey();
  if (tenantKey) config.headers["X-Tenant-ID"] = tenantKey;

  // Login and refresh pass skipAuth so they don't send an expired token.
  if (!config.skipAuth) {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});