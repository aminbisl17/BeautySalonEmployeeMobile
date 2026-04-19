import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { getData } from "../javascript/ProfileAPI";

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginView() {
  const API_AUTHENTICATION_LOGIN =
    Constants.expoConfig?.extra?.API_AUTHENTICATION_LOGIN;

  const API_AUTHENTICATION_REFRESH_TOKEN =
    Constants.expoConfig?.extra?.API_AUTHENTICATION_REFRESH_TOKEN;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  if (!API_AUTHENTICATION_LOGIN || !API_AUTHENTICATION_REFRESH_TOKEN) {
    throw new Error("Missing API!");
  }

  useEffect(() => {
    const autoLogin = async () => {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      try {
        const res = await fetch(API_AUTHENTICATION_REFRESH_TOKEN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        ////   await getData();

        router.replace("/Profile");
        //  Alert.alert("Welcome!", "Hello" + userInfo.emri);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    autoLogin();
  }, []);

  const handleSubmit = async () => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const response = await fetch(API_AUTHENTICATION_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        Alert.alert("Error", "Invalid login or server error");
        return;
      }

      const data = await response.json();

      await SecureStore.setItemAsync("accessToken", data.token);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      await getData();
      router.replace("/Home");
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === "AbortError") {
        Alert.alert("Error", "Server is not responding. Try again.");
      } else {
        Alert.alert("Error", "Network error");
      }

      console.error(err);
    }
  };
  /*
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Checking session...</Text>
      </View>
    );
  }
 */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
    color: "#111827",
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#f9fafb",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  loadingText: {
    marginTop: 10,
    textAlign: "center",
    color: "#6b7280",
  },
});
