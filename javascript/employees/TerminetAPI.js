import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { api } from "../client";

function extractError(error) {
  return String(
    error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Something went wrong.",
  );
}

/* ---------- GET ---------- */

export async function getTerminet() {
  const url = Constants.expoConfig?.extra?.API_TERMINET_GET;
  if (!url) throw new Error("Missing API_TERMINET_GET");

  try {
    const userDetails = await SecureStore.getItemAsync("userDetails");
    const employeeId = userDetails ? JSON.parse(userDetails)?.ID : null;

    if (!employeeId)
      throw new Error("User details not found. Please log in again.");

    const response = await api.get(url + employeeId, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    const msg = extractError(error);
    Alert.alert("Error", msg);
    throw new Error(msg);
  }
}

/* ---------- STATUS MANAGEMENT ---------- */

// Allowed statuses:
// CONFIRMED, EXECUTING, COMPLETED, CANCELLED, NO_SHOW

export async function updateTerminStatus(id, status, cancellationReason) {
  const base = Constants.expoConfig?.extra?.API_TERMINET_STATUS;

  if (!base) throw new Error("Missing API_TERMINET_STATUS");

  const body =
    status === "CANCELLED"
      ? {
          status,
          cancellationReason:
            cancellationReason?.trim() || "Employee requested cancellation",
        }
      : { status };

  try {
    const response = await api.patch(base + id, body, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
}

/* ---------- STATUS ACTIONS ---------- */

// PENDING -> CONFIRMED
export const confirmTermin = (id) => updateTerminStatus(id, "CONFIRMED");

// CONFIRMED -> EXECUTING
export const startTermin = (id) => updateTerminStatus(id, "EXECUTING");

// EXECUTING -> COMPLETED
export const completeTermin = (id) => updateTerminStatus(id, "COMPLETED");

// PENDING / CONFIRMED -> CANCELLED
export const cancelTermin = (id, cancellationReason) =>
  updateTerminStatus(id, "CANCELLED", cancellationReason);

// CONFIRMED -> NO_SHOW
export const markTerminNoShow = (id) => updateTerminStatus(id, "NO_SHOW");

/* ---------- UPDATE (date + note) ---------- */

// payload: { pershkrimi, data_caktimit }

export async function updateTermin(id, payload) {
  const base = Constants.expoConfig?.extra?.API_TERMINET_UPDATE;

  if (!base) throw new Error("Missing API_TERMINET_UPDATE");

  try {
    const response = await api.patch(base + id, payload, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractError(error));
  }
}

/* ---------- HELPERS ---------- */

// LocalDateTime on the backend has no timezone.

export const toLocalDateTime = (d) => {
  const p = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(
    d.getDate(),
  )}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
