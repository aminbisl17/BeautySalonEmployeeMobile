import Constants from "expo-constants";
import { Alert } from "react-native";
import { api } from "../client";

export async function validateCode(data) {
  const url = Constants.expoConfig?.extra?.API_AUTHENTICATION_VALIDATE;
  if (!url) throw new Error("Missing API_AUTHENTICATION_VALIDATE");

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
