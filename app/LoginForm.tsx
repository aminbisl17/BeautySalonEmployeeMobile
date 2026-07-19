import Constants from "expo-constants";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getData } from "../javascript/ProfileAPI";

export default function LoginView() {
  const API_AUTHENTICATION_LOGIN =
    Constants.expoConfig?.extra?.API_AUTHENTICATION_LOGIN;

  const API_AUTHENTICATION_REFRESH_TOKEN =
    Constants.expoConfig?.extra?.API_AUTHENTICATION_REFRESH_TOKEN;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!API_AUTHENTICATION_LOGIN || !API_AUTHENTICATION_REFRESH_TOKEN) {
    throw new Error("Mungon konfigurimi i API-së!");
  }

  useEffect(() => {
    const autoLogin = async () => {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (!refreshToken) {
        setIsVerifyingSession(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, 5000);

        const res = await fetch(API_AUTHENTICATION_REFRESH_TOKEN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
          signal: controller.signal,
        });

        if (!res.ok) {
          setIsVerifyingSession(false);
          return;
        }

        clearTimeout(timeout);
        const data = await res.json();
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await getData();

        setIsVerifyingSession(false);
        router.replace("/Profile");
      } catch (err) {
        Alert.alert("Kyçja dështoi", "Sesioni juaj ka skaduar!");
        setIsVerifyingSession(false);
      }
    };

    autoLogin();
  }, []);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(
        "Fushat e zbrazëta",
        "Ju lutem plotësoni përdoruesin dhe fjalëkalimin.",
      );
      return;
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const res = await fetch(API_AUTHENTICATION_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await res.json();

      if (!res.ok || !data.token) {
        setIsSubmitting(false);
        await SecureStore.deleteItemAsync("refreshToken");
        Alert.alert(
          "Kyçja dështoi",
          data?.error || "Përdoruesi ose fjalëkalimi është i pasaktë.",
        );
        return;
      }

      await SecureStore.setItemAsync("accessToken", data.token);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      await getData();

      setIsSubmitting(false);
      router.replace("/Home");
    } catch (err) {
      clearTimeout(timeout);
      setIsSubmitting(false);

      if (err.name === "AbortError") {
        Alert.alert("Gabim", "Serveri nuk po përgjigjet. Provoni përsëri.");
      } else {
        Alert.alert("Gabim", "Ndodhi një gabim në rrjet.");
      }
      console.error(err);
    }
  };

  const showOverlay = isVerifyingSession || isSubmitting;
  const overlayMessage = isVerifyingSession
    ? "Po verifikohet sesioni..."
    : "Po kyçeni...";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerZone}>
          <Text style={styles.brandTitle}>GLOW & CO.</Text>
          <Text style={styles.brandSubtitle}>Staff Portal Login</Text>
        </View>

        <View style={styles.card}>
          <TextInput
            style={[styles.input, userFocused && styles.inputFocused]}
            placeholder="Username"
            placeholderTextColor="#A0A0A0"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUserFocused(true)}
            onBlur={() => setUserFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, passFocused && styles.inputFocused]}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F2", // Clean, elegant cream background
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FAF7F2",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7A7065",
    letterSpacing: 0.5,
  },
  headerZone: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "300",
    color: "#2C2520", // Deep sophisticated charcoal/brown
    letterSpacing: 4,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#D4A373", // Elegant Muted Rose-gold/Champagne accent
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    // Soft premium shadow profile
    shadowColor: "#2C2520",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#EAE5DF",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FCFBF9",
    fontSize: 15,
    color: "#2C2520",
  },
  inputFocused: {
    borderColor: "#D4A373", // Smooth tint on selection
    backgroundColor: "#FFFFFF",
  },
  button: {
    backgroundColor: "#2C2520", // Solid striking premium dark button
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2C2520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
