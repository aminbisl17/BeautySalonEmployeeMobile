import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export async function getData() {
  const token = await SecureStore.getItemAsync("accessToken");
  const userRes = await fetch("http://192.168.100.116:8000/api/employee/data", {
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
