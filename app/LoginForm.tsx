import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";

//import { getData } from "../javascript/ProfileAPI";

import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function LoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  /*
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const res = await fetch(
          "http://192.168.1.156:8000/auth/refresh-token",
          {
            method: "POST",
            credentials: "include",
          },
        );

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
  */

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        "http://192.168.100.116:8000/auth/login/employee",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        },
      );

      if (response.status === 401) {
        Alert.alert("Error", "Invalid login");
        return;
      }

      const data = await response.json();
      await SecureStore.setItemAsync("accessToken", data.token);
      // await getData();

      router.replace("/Home");
    } catch (err) {
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
