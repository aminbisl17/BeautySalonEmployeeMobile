import { api, clearTenantCache } from "@/javascript/client";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TENANT_TOKEN_KEY = "tenantToken";
const VALIDATE_URL =
  "https://beautysalon-amin-2026-ghfzbxbqcvdfb2hf.austriaeast-01.azurewebsites.net/auth/login/company/validate";
const PRIMARY = "#4F46E5";
const FRAME_SIZE = 260;
const OTP_LENGTH = 6;
const WELCOME_DURATION = 2500; // ms

type Mode = "choose" | "qr" | "manual" | "welcome";

export default function VerifyTenant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("choose");
  const [loading, setLoading] = useState(false);

  // Manual
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const otpInputRef = useRef<TextInput>(null);

  // QR
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scannedRef = useRef(false);

  // Welcome
  const [welcomeName, setWelcomeName] = useState("");
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (mode !== "welcome") return;

    fade.setValue(0);
    scale.setValue(0.85);

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/LoginForm");
    }, WELCOME_DURATION);

    return () => clearTimeout(timer);
  }, [mode]);

  // Shows one error at a time and keeps the scanner locked until it's dismissed
const showScanError = (title: string, message: string) => {
  scannedRef.current = true; // stay locked while the alert is open

  Alert.alert(
    title,
    message,
    [
      {
        text: "Try again",
        onPress: () => {
          // small delay so the camera doesn't instantly re-read the same code
          setTimeout(() => {
            scannedRef.current = false;
          }, 1500);
        },
      },
      {
        text: "Enter manually",
        onPress: () => setMode("manual"),
      },
    ],
    { cancelable: false } // Android: back button / outside tap can't skip the unlock
  );
};

  const verify = async (payload: { username: string; otp: string }) => {
  try {
    setLoading(true);

    const res = await api.post(
      VALIDATE_URL,
      {
        otp: payload.otp,
        username: payload.username,
      },
      { skipAuth: true,
        headers: {
          "X-Tenant-ID": "tenant-dbo",
        },
       },
    );

   const data = res.data;
console.log("VERIFY:", res.status, data);

const token = data?.accessToken;

if (!token) {
  throw new Error("No token returned from server");
}

await SecureStore.setItemAsync(TENANT_TOKEN_KEY, String(token));
clearTenantCache(); // so the interceptor picks up the new tenant key
setWelcomeName(payload.username);
setMode("welcome");

} catch (error: any) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Invalid username or OTP";

  console.log("VERIFY ERROR:", error?.response?.status, error?.response?.data);
  showScanError("Verification failed", String(message));
} finally {
  setLoading(false);
}
};

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current || loading) return;
    scannedRef.current = true;

    try {
      // QR is expected to contain: {"username":"amin","otp":"742081"}
      const parsed = JSON.parse(data);
      if (!parsed?.username || !parsed?.otp) throw new Error("Missing fields");

      verify({ username: String(parsed.username), otp: String(parsed.otp) });
    } catch {
      Alert.alert("Invalid QR code", "This QR code is not a valid tenant code.");
      setTimeout(() => {
        scannedRef.current = false;
      }, 1500);
    }
  };

  const openQr = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera permission needed",
          "Please allow camera access in settings to scan the QR code."
        );
        return;
      }
    }
    scannedRef.current = false;
    setMode("qr");
  };

  const canSubmit = !loading && username.trim().length > 0 && otp.length === OTP_LENGTH;

  // ================= WELCOME =================
  if (mode === "welcome") {
    return (
      <View style={styles.welcomeScreen}>
        <Animated.View
          style={{
            alignItems: "center",
            opacity: fade,
            transform: [{ scale }],
          }}
        >
          <View style={styles.welcomeIcon}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.welcomeLabel}>Welcome</Text>
          <Text style={styles.welcomeName}>{welcomeName}</Text>
          <Text style={styles.welcomeSub}>Verification successful</Text>
        </Animated.View>
      </View>
    );
  }

  // ================= CHOOSE =================
  if (mode === "choose") {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="shield-checkmark" size={40} color={PRIMARY} />
        </View>

        <Text style={styles.title}>Verify your tenant</Text>
        <Text style={styles.subtitle}>
          Choose how you would like to connect to your organization.
        </Text>

        <View style={styles.cards}>
          <Pressable
            onPress={openQr}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="qr-code-outline" size={26} color={PRIMARY} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Scan QR code</Text>
              <Text style={styles.cardDesc}>Fastest way, just point your camera</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>

          <Pressable
            onPress={() => setMode("manual")}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={[styles.cardIcon, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="keypad-outline" size={26} color="#059669" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Enter code manually</Text>
              <Text style={styles.cardDesc}>Use your username and 6-digit OTP</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        </View>
      </View>
    );
  }

  // ================= QR =================
  if (mode === "qr") {
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Dark mask: top / middle row / bottom, frame is always centered */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.mask, styles.maskTop]}>
            <Text style={styles.scanTitle}>Scan QR code</Text>
            <Text style={styles.scanSubtitle}>Align the code inside the frame</Text>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.mask} />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.mask} />
          </View>

          <View style={[styles.mask, styles.maskBottom]} />
        </View>

        {/* Top bar */}
        <View style={[styles.topBar, { top: insets.top + 12 }]}>
          <Pressable style={styles.roundButton} onPress={() => setMode("choose")}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={[styles.roundButton, torch && styles.roundButtonActive]}
            onPress={() => setTorch((t) => !t)}
          >
            <Ionicons name={torch ? "flash" : "flash-outline"} size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Bottom action */}
        <View style={[styles.bottomBar, { bottom: insets.bottom + 24 }]}>
          <Pressable style={styles.glassButton} onPress={() => setMode("manual")}>
            <Ionicons name="keypad-outline" size={18} color="#fff" />
            <Text style={styles.glassButtonText}>Enter code manually</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}
      </View>
    );
  }

  // ================= MANUAL =================
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screenBg}
        contentContainerStyle={[
          styles.manualContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backCircle} onPress={() => setMode("choose")}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>

        <Text style={[styles.title, { marginTop: 24 }]}>Enter your details</Text>
        <Text style={styles.subtitle}>
          Type your username and the 6-digit code you received.
        </Text>

        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={20} color="#94A3B8" />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Your username"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <Text style={styles.label}>One-time code</Text>
        <Pressable onPress={() => otpInputRef.current?.focus()}>
          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const char = otp[i];
              const active = i === otp.length && otp.length < OTP_LENGTH;
              return (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    char && styles.otpBoxFilled,
                    active && styles.otpBoxActive,
                  ]}
                >
                  <Text style={styles.otpChar}>{char ?? ""}</Text>
                </View>
              );
            })}
          </View>
        </Pressable>

        {/* Hidden input that actually captures the digits */}
        <TextInput
          ref={otpInputRef}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          style={styles.hiddenInput}
        />

        <Pressable
          style={[styles.primaryButton, !canSubmit && styles.disabled]}
          onPress={() => verify({ username: username.trim(), otp })}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify</Text>
          )}
        </Pressable>

        <Pressable style={styles.linkButton} onPress={openQr}>
          <Ionicons name="qr-code-outline" size={18} color={PRIMARY} />
          <Text style={styles.linkButtonText}>Scan QR code instead</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CORNER = 36;
const CORNER_THICKNESS = 5;
const MASK = "rgba(0,0,0,0.65)";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#F8FAFC", paddingHorizontal: 24 },
  screenBg: { flex: 1, backgroundColor: "#F8FAFC" },

  // Welcome
  welcomeScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  welcomeIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  welcomeLabel: { fontSize: 18, color: "#64748B", fontWeight: "500" },
  welcomeName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 4,
    textAlign: "center",
  },
  welcomeSub: { fontSize: 14, color: "#94A3B8", marginTop: 12 },

  // Choose
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 22,
  },
  cards: { gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  cardDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // Camera
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  mask: { flex: 1, backgroundColor: MASK },
  maskTop: { alignItems: "center", justifyContent: "flex-end", paddingBottom: 28 },
  maskBottom: {},
  middleRow: { flexDirection: "row", height: FRAME_SIZE },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE },
  scanTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  scanSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 6 },

  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "#fff",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 18,
  },

  topBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundButtonActive: { backgroundColor: PRIMARY },
  bottomBar: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  glassButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  glassButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#fff", marginTop: 12, fontSize: 15 },

  // Manual
  manualContent: { paddingHorizontal: 24 },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  input: { flex: 1, paddingVertical: 16, paddingLeft: 10, fontSize: 16, color: "#0F172A" },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: { borderColor: "#A5B4FC", backgroundColor: "#F5F7FF" },
  otpBoxActive: { borderColor: PRIMARY },
  otpChar: { fontSize: 24, fontWeight: "700", color: "#0F172A" },
  hiddenInput: { position: "absolute", opacity: 0, height: 0, width: 0 },

  primaryButton: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.45, shadowOpacity: 0 },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    padding: 12,
  },
  linkButtonText: { color: PRIMARY, fontSize: 15, fontWeight: "600" },
});