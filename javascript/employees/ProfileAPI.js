import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import { api } from "../client";

export async function getData() {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_DATA;
  if (!url) throw new Error("Missing API_EMPLOYEE_DATA");

  try {
    const response = await api.get(url, { withCredentials: true });

    await SecureStore.setItemAsync(
      "userDetails",
      JSON.stringify(response.data),
    );

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

export const updateData = async (payload) => {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_DATA;
  if (!url) throw new Error("Missing API_EMPLOYEE_DATA");

  try {
    const response = await api.patch(url, payload);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
};