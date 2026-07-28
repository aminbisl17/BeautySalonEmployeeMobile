import { getData } from "@/javascript/employees/ProfileAPI";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [emri, setEmri] = useState("");
  const [mbiemri, setMbiemri] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUser = async (isRefresh = false) => {
    try {
      await getData();

      const data = await SecureStore.getItemAsync("userDetails");
      if (data) {
        const parsedUser = JSON.parse(data);
        setUser(parsedUser);
        // Pre-fill edit form state
        setEmri(parsedUser?.emri || "");
        setMbiemri(parsedUser?.mbiemri || "");
        setUsername(parsedUser?.username || "");
      }
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

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedUser = { ...user, emri, mbiemri, username };

      // Update state & local SecureStore
      setUser(updatedUser);
      await SecureStore.setItemAsync(
        "userDetails",
        JSON.stringify(updatedUser),
      );

      // TODO: Call your API backend update function here if available
      // e.g., await updateUserData({ emri, mbiemri, username });

      setIsEditing(false);
    } catch (e) {
      console.error("Gabim gjatë ruajtjes së profilit:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset values to original state
    setEmri(user?.emri || "");
    setMbiemri(user?.mbiemri || "");
    setUsername(user?.username || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Po ngarkohet profili...</Text>
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
      {/* 1. Profile Hero Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {emri?.[0]}
            {mbiemri?.[0]}
          </Text>
        </View>

        {!isEditing ? (
          <>
            <Text style={styles.name}>
              {user?.emri} {user?.mbiemri}
            </Text>
            <Text style={styles.username}>@{user?.username}</Text>
          </>
        ) : (
          <Text style={[styles.username, { marginTop: 4 }]}>
            Ndryshoni të dhënat tuaja më poshtë
          </Text>
        )}
      </View>

      {/* 2. Account Details Section Panel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Të Dhënat e Llogarisë</Text>

        <View style={styles.groupCard}>
          {/* Editable Name Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#4F46E5"
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Emri</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.value, styles.input]}
                    value={emri}
                    onChangeText={setEmri}
                    placeholder="Vendos emrin"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.value}>
                    {user?.emri || "E papërcaktuar"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Editable Last Name Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#4F46E5"
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Mbiemri</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.value, styles.input]}
                    value={mbiemri}
                    onChangeText={setMbiemri}
                    placeholder="Vendos mbiemrin"
                    placeholderTextColor="#94A3B8"
                  />
                ) : (
                  <Text style={styles.value}>
                    {user?.mbiemri || "E papërcaktuar"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Editable Username Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="at-outline"
                size={18}
                color="#4F46E5"
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Emri i Përdoruesit</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.value, styles.input]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Vendos përdoruesin"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.value}>@{user?.username}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Read-Only Email Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#4F46E5"
                style={styles.icon}
              />
              <View>
                <Text style={styles.label}>Adresa e Email-it</Text>
                <Text style={styles.value}>
                  {user?.email || "E papërcaktuar"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Read-Only Phone Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name="call-outline"
                size={18}
                color="#4F46E5"
                style={styles.icon}
              />
              <View>
                <Text style={styles.label}>Numri i Telefonit</Text>
                <Text style={styles.value}>
                  {user?.numri_telefonit || "Nuk është dhënë"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Actions Section */}
      <View style={{ gap: 10 }}>
        {!isEditing ? (
          <>
            {/* Edit Profile Button */}
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              activeOpacity={0.8}
              style={styles.editButton}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.editButtonText}>Ndrysho Të Dhënat</Text>
            </TouchableOpacity>

            {/* Logout Button */}
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
              <Text style={styles.logoutText}>Dil nga Llogaria</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.8}
              style={styles.editButton}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.editButtonText}>Ruaj Ndryshimet</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleCancelEdit}
              disabled={saving}
              activeOpacity={0.8}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Anulo</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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

  /* Navigation Header */
  navigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  navigationTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },

  /* Profile Avatar Header */
  profileHeaderCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  username: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },

  /* Primary Action Button Styles */
  editButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  /* Card Sections */
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#4F46E5",
    paddingVertical: 2,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 48,
  },

  /* Action Buttons */
  logoutButton: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
});
