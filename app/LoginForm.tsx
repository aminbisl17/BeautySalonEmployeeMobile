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
    } catch (err: any) {
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

  if (isVerifyingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Po verifikohet sesioni...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerZone}>
          <Text style={styles.brandTitle}>BeautySalon</Text>
          <Text style={styles.brandSubtitle}>Portali i Stafit</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kyçuni në llogari</Text>

          <TextInput
            style={[styles.input, userFocused && styles.inputFocused]}
            placeholder="Përdoruesi"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={setUsername}
            onFocus={() => setUserFocused(true)}
            onBlur={() => setUserFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, passFocused && styles.inputFocused]}
            placeholder="Fjalëkalimi"
            placeholderTextColor="#94A3B8"
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
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Kyçuni</Text>
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
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  headerZone: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 3,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
    color: "#0F172A",
  },
  inputFocused: {
    borderColor: "#4F46E5",
  },
  button: {
    backgroundColor: "#4F46E5",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
