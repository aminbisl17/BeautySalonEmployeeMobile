import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import { getData, updateData } from "@/javascript/employees/ProfileAPI";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [emri, setEmri] = useState("");
  const [mbiemri, setMbiemri] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [numriTelefonit, setNumriTelefonit] = useState("");
  const [userpassword, setUserpassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUser = async (isRefresh = false) => {
    try {
      await getData();

      const data = await SecureStore.getItemAsync("userDetails");
      if (data) {
        const parsedUser = JSON.parse(data);
        setUser(parsedUser);

        setEmri(parsedUser?.emri || "");
        setMbiemri(parsedUser?.mbiemri || "");
        setUsername(parsedUser?.username || "");
        setEmail(parsedUser?.email || "");
        setNumriTelefonit(parsedUser?.numri_telefonit || "");
        setUserpassword(parsedUser?.userpassword || "");
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

  const executeSaveProfile = async () => {
    try {
      setSaving(true);

      const payload = {
        emri: emri.trim(),
        mbiemri: mbiemri.trim(),
        email: email.trim(),
        numri_telefonit: numriTelefonit.trim(),
        username: username.trim(),
        userpassword: userpassword,
      };

      await updateData(payload);

      const updatedUser = { ...user, ...payload };
      setUser(updatedUser);
      await SecureStore.setItemAsync(
        "userDetails",
        JSON.stringify(updatedUser),
      );

      setIsEditing(false);
    } catch (e) {
      console.error("Gabim gjatë ruajtjes së profilit:", e);
      Alert.alert("Gabim", "Diçka shkoi gabim gjatë ruajtjes së profilit.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = () => {
    // Validimi: Fushate e zbrazura (pervec fjalekalimit)
    if (
      !emri.trim() ||
      !mbiemri.trim() ||
      !username.trim() ||
      !email.trim() ||
      !numriTelefonit.trim()
    ) {
      Alert.alert(
        "Kujdes",
        "Të gjitha fushat përveç fjalëkalimit duhet të plotësohen.",
      );
      return;
    }

    // Dialogu i konfirmimit
    Alert.alert(
      "Konfirmo Ruajtjen",
      "A jeni të sigurt që dëshironi të ruani ndryshimet?",
      [
        {
          text: "Anulo",
          style: "cancel",
        },
        {
          text: "Po, Ruaj",
          onPress: executeSaveProfile,
        },
      ],
    );
  };

  const handleCancelEdit = () => {
    setEmri(user?.emri || "");
    setMbiemri(user?.mbiemri || "");
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setNumriTelefonit(user?.numri_telefonit || "");
    setUserpassword(user?.userpassword || "");
    setShowPassword(false);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.green} />
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
          tintColor={COLORS.green}
          colors={[COLORS.green]}
        />
      }
    >
      {/* Header band */}
      <View style={[styles.headerZone, { paddingTop: insets.top + 32 }]}>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Profili</Text>
        </View>

        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {emri?.[0]}
              {mbiemri?.[0]}
            </Text>
          </View>
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

      <View style={styles.body}>
        {/* Card Sections */}
        <View style={styles.section}>
          <View style={styles.groupCard}>
            <Text style={styles.sectionTitle}>Të Dhënat e Llogarisë</Text>

            {/* 1. Emri */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.green}
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
                      placeholderTextColor={COLORS.placeholder}
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

            {/* 2. Mbiemri */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.green}
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
                      placeholderTextColor={COLORS.placeholder}
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

            {/* 3. Emri i Përdoruesit */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="at-outline"
                  size={18}
                  color={COLORS.green}
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
                      placeholderTextColor={COLORS.placeholder}
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.value}>@{user?.username}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* 4. Email */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={COLORS.green}
                  style={styles.icon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Adresa e Email-it</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.value, styles.input]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Vendos email-in"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {user?.email || "E papërcaktuar"}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* 5. Numri i Telefonit */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={COLORS.green}
                  style={styles.icon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Numri i Telefonit</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.value, styles.input]}
                      value={numriTelefonit}
                      onChangeText={setNumriTelefonit}
                      placeholder="Vendos numrin e telefonit"
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.value}>
                      {user?.numri_telefonit || "Nuk është dhënë"}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* 6. Fjalëkalimi */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={COLORS.green}
                  style={styles.icon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Fjalëkalimi</Text>
                  {isEditing ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <TextInput
                        style={[styles.value, styles.input, { flex: 1 }]}
                        value={userpassword}
                        onChangeText={setUserpassword}
                        placeholder="Vendos fjalëkalimin e ri"
                        placeholderTextColor={COLORS.placeholder}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ paddingHorizontal: 8 }}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={18}
                          color={COLORS.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.value}>••••••••</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isEditing ? (
            <>
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

              <TouchableOpacity
                onPress={handleLogout}
                activeOpacity={0.8}
                style={styles.logoutButton}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={COLORS.red}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.logoutText}>Dil nga Llogaria</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cream,
  },
  loadingText: {
    marginTop: 14,
    color: COLORS.muted,
    fontSize: 12,
  },

  /* Header band (.termini-header) */
  headerZone: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 74,
  },
  badgePill: {
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    color: COLORS.goldSoft,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  avatarRing: {
    padding: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: 52,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.green,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: COLORS.goldLight,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  name: {
    color: "#F7F5EF",
    fontSize: 30,
    fontWeight: "500",
    letterSpacing: -1.2,
    textAlign: "center",
  },
  username: {
    marginTop: 6,
    color: COLORS.goldSoft,
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 16,
    letterSpacing: -0.3,
    textAlign: "center",
  },

  /* Body overlaps the header (.termini-container margin-top) */
  body: {
    marginHorizontal: 12,
    marginTop: -34,
  },

  /* Card (.form-section-card) */
  section: {
    marginBottom: 18,
  },
  groupCard: {
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.card,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.7,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 20,
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
    marginRight: 16,
  },
  label: {
    marginBottom: 3,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  value: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  // edit mode: boxed input like .input-box input
  input: {
    minHeight: 46,
    marginTop: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    height: 1,
    marginLeft: 54,
    backgroundColor: COLORS.border,
  },

  /* Buttons (.confirm-btn-primary / -secondary) */
  actions: {
    gap: 10,
  },
  editButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  logoutButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dangerBg,
  },
  logoutText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  cancelButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
    backgroundColor: "#EAE8E2",
  },
  cancelText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});