import { getData } from "@/javascript/ProfileAPI";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUser = async (isRefresh = false) => {
    try {
      await getData();

      const data = await SecureStore.getItemAsync("userDetails");
      if (data) setUser(JSON.parse(data));
    } catch (e) {
      console.log(e);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser(true);
    setRefreshing(false);
  }, []);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4F46E5"
          colors={["#4F46E5"]}
        />
      }
    >
      {/* Header Profile Section */}
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

      {/* User Information Grouped Card */}
      <Text style={styles.sectionTitle}>Account Details</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#64748B"
              style={styles.icon}
            />
            <View>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="call-outline"
              size={18}
              color="#64748B"
              style={styles.icon}
            />
            <View>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>
                {user?.numri_telefonit || "Not Provided"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name="at-outline"
              size={18}
              color="#64748B"
              style={styles.icon}
            />
            <View>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>@{user?.username}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Logout Action Area */}
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.8}
        style={styles.logoutButton}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color="#EF4444"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    paddingBottom: 40,
    paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "500",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  username: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  group: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 14,
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 48, // Aligns cleanly past the icon edge
  },
  logoutButton: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
