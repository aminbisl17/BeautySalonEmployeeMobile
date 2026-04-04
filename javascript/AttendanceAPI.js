import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function validateCode(data) {
  const token = await SecureStore.getItemAsync("accessToken");
  const response = await fetch(
    "http://192.168.100.116:8000/auth/validate-qr_code",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // ✅ FIXED
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
