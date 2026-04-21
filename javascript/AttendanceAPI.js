import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function validateCode(data) {

  const API_AUTHENTICATION_VALIDATE = Constants.expoConfig?.extra?.API_AUTHENTICATION_VALIDATE
   if (!API_AUTHENTICATION_VALIDATE) {
  throw new Error("Missing API_AUTHENTICATION_VALIDATE");
}
  const token = await SecureStore.getItemAsync("accessToken");
  const response = await fetch(API_AUTHENTICATION_VALIDATE
    ,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    Alert.alert("Error", errorText);
    return;
  }

  const result = await response.json(); // ✅ FIXED
  return result;
}