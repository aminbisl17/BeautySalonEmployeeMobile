import { getData } from "@/javascript/ProfileAPI";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await getData();

        const data = await SecureStore.getItemAsync("userDetails");
        if (data) setUser(JSON.parse(data));
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("userDetails");
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      router.replace("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.emri?.[0]}
            {user?.mbiemri?.[0]}
          </Text>
        </View>

        <Text style={styles.name}>
          {user?.emri} {user?.mbiemri}
        </Text>

        <Text style={styles.username}>@{user?.username}</Text>
      </View>

      {/* Grouped Card */}
      <View style={styles.group}>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user?.numri_telefonit}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>@{user?.username}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.7}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // iOS system background
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },

  loadingText: {
    marginTop: 10,
    color: "#8E8E93",
    fontSize: 14,
  },

  // HEADER (Apple ID style)
  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 25,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },

  avatarText: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
  },

  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1C1C1E",
  },

  username: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },

  // GROUPED CARD (iOS Settings style)
  group: {
    backgroundColor: "white",
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  label: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  value: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "500",
  },

  separator: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginLeft: 16,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#F2F2F7",

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  logoutText: {
    color: "#FF3B30", // iOS system red
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
