import Constants from "expo-constants";
import { Alert } from "react-native";
import { api } from "../client";


export async function fetchServices() {
  const url = Constants.expoConfig?.extra?.API_SHERBIMET_ALL;
  if (!url) throw new Error("Missing API_SHERBIMET_ALL");

  try {
    const response = await api.get(url, { withCredentials: true });

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


export async function fetchServiceAtributes(id) {
  const url = Constants.expoConfig?.extra?.API_SHERBIMET_ATRIBUTET;
  if (!url) throw new Error("Missing API_SHERBIMET_ATRIBUTET");

  try {
    const response = await api.get(url + id, { withCredentials: true });
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