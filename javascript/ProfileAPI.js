import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function getData() {
  const API_EMPLOYEE_DATA = Constants.expoConfig?.extra?.API_EMPLOYEE_DATA;

  if(!API_EMPLOYEE_DATA){
    throw new Error("API missing for API_EMPLOYEE_DATA!");
  }
  const token = await SecureStore.getItemAsync("accessToken");
  const userRes = await fetch(API_EMPLOYEE_DATA, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!userRes.ok) {
    Alert.alert("Error", userRes.message);
    return;
  }

  const text = await userRes.json();
  await SecureStore.setItemAsync("userDetails", JSON.stringify(text));
}
