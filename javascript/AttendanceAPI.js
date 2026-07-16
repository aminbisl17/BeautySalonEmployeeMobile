import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function validateCode(data) {
  const API_AUTHENTICATION_VALIDATE =
    Constants.expoConfig?.extra?.API_AUTHENTICATION_VALIDATE;

  if (!API_AUTHENTICATION_VALIDATE) {
    throw new Error("Missing API_AUTHENTICATION_VALIDATE");
  }

  const token = await SecureStore.getItemAsync("accessToken");

  try {
    const response = await axios.post(API_AUTHENTICATION_VALIDATE, data, {
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
