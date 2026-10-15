import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { api } from "../client";

export async function getTerminet() {
  const url = Constants.expoConfig?.extra?.API_TERMINET_GET;
  if (!url) throw new Error("Missing API_TERMINET_GET");

  try {
    const userDetails = await SecureStore.getItemAsync("userDetails");
    const employeeId = userDetails ? JSON.parse(userDetails)?.ID : null;
    if (!employeeId) throw new Error("User details not found. Please log in again.");

    const response = await api.get(url + employeeId, { withCredentials: true });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Something went wrong.";

    Alert.alert("Error", String(errorMessage));
    throw new Error(String(errorMessage));
  }
}