import axios from "axios";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function getTerminet(params) {
  const API = Constants.expoConfig?.extra?.API_TERMINET_GET;

  if (!API) {
    throw new Error("API missing for API_TERMINET_GET!");
  }

  try {
    const token = await SecureStore.getItemAsync("accessToken");
    const userID = await SecureStore.getItemAsync("userDetails");

    const response = await axios.get(API + JSON.parse(userID).ID, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data || error.message || "Something went wrong.";

    Alert.alert("Error", errorMessage);
    throw new Error(errorMessage);
  }
}
