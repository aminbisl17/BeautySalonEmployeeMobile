import axios from "axios";
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

  try {
    const response = await axios.post(API_EMPLOYEE_SET_AVAILABLE_DATES, data, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getAvailability() {
  const API_EMPLOYEE_GET_AVAILABLE_DATES =
    Constants.expoConfig?.extra?.API_EMPLOYEE_GET_AVAILABLE_DATES;

  if (!API_EMPLOYEE_GET_AVAILABLE_DATES) {
    throw new Error("Missing API_EMPLOYEE_GET_AVAILABLE_DATES");
  }

  const token = await SecureStore.getItemAsync("accessToken");

  try {
    const response = await axios.get(API_EMPLOYEE_GET_AVAILABLE_DATES, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}

export async function updateDates(dates, id) {
  const API_EMPLOYEE_UPDATE_AVAILABLE_DATES =
    Constants.expoConfig?.extra?.API_EMPLOYEE_UPDATE_AVAILABLE_DATES;

  if (!API_EMPLOYEE_UPDATE_AVAILABLE_DATES) {
    throw new Error("Missing API_EMPLOYEE_UPDATE_AVAILABLE_DATES");
  }

  const token = await SecureStore.getItemAsync("accessToken");

  try {
    const res = await axios.patch(
      API_EMPLOYEE_UPDATE_AVAILABLE_DATES + id,
      dates, // <-- JSON body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}
