import Constants from "expo-constants";
import { Alert } from "react-native";
import { api } from "../client";

export async function setAvailableDates(data) {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_SET_AVAILABLE_DATES;
  if (!url) throw new Error("Missing API_EMPLOYEE_SET_AVAILABLE_DATES");

  try {
    const response = await api.post(url, data);
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

export async function getAvailability() {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_GET_AVAILABLE_DATES;
  if (!url) throw new Error("Missing API_EMPLOYEE_GET_AVAILABLE_DATES");

  try {
    const response = await api.get(url);
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

export async function updateDates(dates, id) {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_UPDATE_AVAILABLE_DATES;
  if (!url) throw new Error("Missing API_EMPLOYEE_UPDATE_AVAILABLE_DATES");

  try {
    const response = await api.patch(url + id, dates);
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

export async function deleteDate(id) {
  const url = Constants.expoConfig?.extra?.API_EMPLOYEE_DELETE_AVAILABLE_DATES;
  if (!url) throw new Error("Missing API_EMPLOYEE_DELETE_AVAILABLE_DATES");

  try {
    const response = await api.delete(url + id);

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