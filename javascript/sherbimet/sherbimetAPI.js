import axios from "axios";
import Constants from "expo-constants";

export async function fetchServices() {
  const API_SHERBIMET_ALL = Constants.expoConfig?.extra?.API_SHERBIMET_ALL;

  if (!API_SHERBIMET_ALL) {
    throw new Error("API missing for API_SHERBIMET_ALL!");
  }
  try {
    const response = await axios.get(API_SHERBIMET_ALL, {
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
