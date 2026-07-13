import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function setAvailableDates(data) {
  const API_EMPLOYEE_SET_AVAILABLE_DATES =
    Constants.expoConfig?.extra?.API_EMPLOYEE_SET_AVAILABLE_DATES;

  if (!API_EMPLOYEE_SET_AVAILABLE_DATES) {
    throw new Error("Missing API_EMPLOYEE_SET_AVAILABLE_DATES");
  }

  const token = await SecureStore.getItemAsync("accessToken");

  const response = await fetch(API_EMPLOYEE_SET_AVAILABLE_DATES, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    Alert.alert("Error", errorText || "Something went wrong.");
    throw new Error(errorText);
  }

  return await response.text();
}
