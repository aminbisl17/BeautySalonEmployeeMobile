import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function getData() {
  const API_EMPLOYEE_DATA = Constants.expoConfig?.extra?.API_EMPLOYEE_DATA;

  if (!API_EMPLOYEE_DATA) {
    throw new Error("API missing for API_EMPLOYEE_DATA!");
  }

  const token = await SecureStore.getItemAsync("accessToken");

  try {
    const response = await axios.get(API_EMPLOYEE_DATA, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    await SecureStore.setItemAsync(
      "userDetails",
      JSON.stringify(response.data),
    );

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}

export const updateData = async (payload) => {
  const API = Constants.expoConfig?.extra?.API_EMPLOYEE_DATA;

  if (!API) {
    throw new Error("API missing for API_EMPLOYEE_DATA_DATA!");
  }

  try {
    const token = await SecureStore.getItemAsync("accessToken");

    const response = await axios.patch(API, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios Error:", error.response?.data || error.message);
    } else {
      console.error("Unexpected Error:", error);
    }
    throw error;
  }
};
