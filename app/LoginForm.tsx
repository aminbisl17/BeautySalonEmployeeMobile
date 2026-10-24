import Constants from "expo-constants";

import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { api } from "../javascript/client";
import { getData } from "../javascript/employees/ProfileAPI";

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

const extra = Constants.expoConfig?.extra;
const API_LOGIN = extra?.API_AUTHENTICATION_LOGIN as string | undefined;
const API_REFRESH = extra?.API_AUTHENTICATION_REFRESH_TOKEN as
  | string
  | undefined;

const CONFIG_MISSING = !API_LOGIN || !API_REFRESH;
const POST_LOGIN_ROUTE = "/Home" as const;
const REFRESH_TIMEOUT_MS = 5000;
const LOGIN_TIMEOUT_MS = 8000;

/* -------------------------------------------------------------------------- */
/* Network helpers                                                            */
/* -------------------------------------------------------------------------- */

type ApiResult = { ok: boolean; status: number; data: any };

/**
 * POSTs through the shared client without the stored access token
 * (login and refresh must not send an expired one). HTTP error responses are
 * returned as a result; timeouts and network failures still throw
 * (see toErrorMessage).
 */
async function postPublic(
  url: string,
  body: unknown,
  timeout: number,
): Promise<ApiResult> {
  try {
    const res = await api.post(url, body, { timeout, skipAuth: true });
    return { ok: true, status: res.status, data: res.data };
  } catch (err: any) {
    if (err?.response) {
      return {
        ok: false,
        status: err.response.status,
        data: err.response.data,
      };
    }
    throw err;
  }
}

function serverMessage(data: any): string | undefined {
  const msg = data?.error ?? data?.message;
  return typeof msg === "string" && msg.trim() ? msg : undefined;
}

function messageForStatus(status: number, data: any): string {
  const fromServer = serverMessage(data);

  if (status === 400 || status === 401 || status === 403) {
    return fromServer || "Përdoruesi ose fjalëkalimi është i pasaktë.";
  }
  if (status === 429) {
    return "Shumë përpjekje. Prisni pak dhe provoni përsëri.";
  }
  if (status >= 500) {
    return "Serveri po has probleme. Provoni përsëri më vonë.";
  }
  return fromServer || "Kyçja dështoi. Provoni përsëri.";
}

function toErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
    return "Serveri nuk po përgjigjet. Provoni përsëri.";
  }
  return "Nuk u lidh me serverin. Kontrolloni internetin dhe provoni përsëri.";
}

/* -------------------------------------------------------------------------- */
/* UI components                                                              */
/* -------------------------------------------------------------------------- */

function LoadingScreen({ message }: { message: string }) {
  return (
    <View style={styles.centered}>
  <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

function Banner({
  message,
  tone,
}: {
  message: string;
  tone: "error" | "info";
}) {
  const isError = tone === "error";
  return (
    <View
      style={[styles.banner, isError ? styles.bannerError : styles.bannerInfo]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={[
          styles.bannerText,
          isError ? styles.bannerTextError : styles.bannerTextInfo,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightAction?: { label: string; onPress: () => void; a11yLabel: string };
};

const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, rightAction, onFocus, onBlur, style, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.placeholder}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />

        {rightAction && (
          <Pressable
            onPress={rightAction.onPress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={rightAction.a11yLabel}
            style={styles.rightAction}
          >
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
});

function PrimaryButton({
  title,
  loading,
  onPress,
}: {
  title: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

type BannerState = { message: string; tone: "error" | "info" } | null;
type FieldErrors = { username?: string; password?: string };

export default function LoginView() {
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<BannerState>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(!CONFIG_MISSING);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ------------------------------ Auto login ------------------------------ */

  useEffect(() => {
    if (CONFIG_MISSING) return;

    const autoLogin = async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) return;

        const { ok, status, data } = await postPublic(
          API_REFRESH!,
          { refreshToken },
          REFRESH_TIMEOUT_MS,
        );

        if (!ok || !data?.accessToken) {
          // Only discard the token when the server actually rejected it,
          // so a flaky connection doesn't log the user out for good.
          if (status === 400 || status === 401 || status === 403) {
            await SecureStore.deleteItemAsync("refreshToken");
          }
          if (mounted.current) {
            setBanner({
              message:
                status >= 500
                  ? "Serveri po has probleme. Kyçuni përsëri."
                  : "Sesioni juaj ka skaduar. Kyçuni përsëri.",
              tone: "info",
            });
          }
          return;
        }

        await SecureStore.setItemAsync("accessToken", data.accessToken);
        if (typeof data.refreshToken === "string") {
          await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        }

        await getData();

        if (mounted.current) router.replace(POST_LOGIN_ROUTE);
      } catch (err) {
        console.error("Auto login failed:", err);
        if (mounted.current) {
          setBanner({ message: toErrorMessage(err), tone: "info" });
        }
      } finally {
        if (mounted.current) setIsVerifyingSession(false);
      }
    };

    autoLogin();
  }, []);

  /* ------------------------------ Manual login ---------------------------- */

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Shkruani përdoruesin.";
    if (!password.trim()) errors.password = "Shkruani fjalëkalimin.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setBanner(null);
    if (!validate()) return;

    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      const { ok, status, data } = await postPublic(
        API_LOGIN!,
        { username: username.trim(), password },
        LOGIN_TIMEOUT_MS,
      );

      if (!ok || !data?.token) {
        await SecureStore.deleteItemAsync("refreshToken");
        setBanner({
          message: messageForStatus(ok ? 401 : status, data),
          tone: "error",
        });
        return;
      }

      await SecureStore.setItemAsync("accessToken", data.token);
      if (typeof data.refreshToken === "string") {
        await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      }

      try {
        await getData();
      } catch (profileError) {
        // Without profile data the rest of the app can't work, so don't
        // leave the user half logged in.
        console.error("Profile fetch failed:", profileError);
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        setBanner({
          message: "Nuk u ngarkuan të dhënat e profilit. Provoni përsëri.",
          tone: "error",
        });
        return;
      }

      router.replace(POST_LOGIN_ROUTE);
    } catch (err) {
      console.error("Login failed:", err);
      setBanner({ message: toErrorMessage(err), tone: "error" });
    } finally {
      if (mounted.current) setIsSubmitting(false);
    }
  };

  /* -------------------------------- Render -------------------------------- */

  if (CONFIG_MISSING) {
    return (
      <View style={styles.centered}>
        <Text style={styles.configTitle}>Aplikacioni nuk është konfiguruar</Text>
        <Text style={styles.configText}>
          Mungon konfigurimi i API-së. Kontaktoni administratorin.
        </Text>
      </View>
    );
  }

  if (isVerifyingSession) {
    return <LoadingScreen message="Po verifikohet sesioni..." />;
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
        
        
        <View style={[styles.headerZone, { paddingTop: insets.top + 56 }]}>
  <View style={styles.badgePill}>
    <Text style={styles.badgePillText}>Portali i Stafit</Text>
  </View>
  <Text style={styles.brandTitle}>Beauty</Text>
  <Text style={styles.brandTitleSerif}>Salon</Text>
  <Text style={styles.brandSubtitle}>
    Kyçuni për të parë terminet dhe orarin tuaj.
  </Text>
</View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kyçuni në llogari</Text>

          {banner && <Banner message={banner.message} tone={banner.tone} />}

          <Field
            label="Përdoruesi"
            placeholder="Shkruani përdoruesin"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (fieldErrors.username) {
                setFieldErrors((p) => ({ ...p, username: undefined }));
              }
            }}
            error={fieldErrors.username}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            editable={!isSubmitting}
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />

          <Field
            ref={passwordRef}
            label="Fjalëkalimi"
            placeholder="Shkruani fjalëkalimin"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) {
                setFieldErrors((p) => ({ ...p, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            editable={!isSubmitting}
            onSubmitEditing={handleSubmit}
            rightAction={{
              label: showPassword ? "Fshihe" : "Shfaqe",
              a11yLabel: showPassword
                ? "Fshih fjalëkalimin"
                : "Shfaq fjalëkalimin",
              onPress: () => setShowPassword((v) => !v),
            }}
          />

          <PrimaryButton
            title="Kyçuni"
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.cream,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 12,
    color: COLORS.muted,
  },
  configTitle: {
    fontSize: 22,
    fontWeight: "500",
    letterSpacing: -0.8,
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  configText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
  },

  /* Header (.termini-header) */
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
  brandTitle: {
    color: "#F7F5EF",
    fontSize: 42,
    fontWeight: "500",
    letterSpacing: -2.5,
    lineHeight: 42,
    textAlign: "center",
  },
  brandTitleSerif: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontWeight: "400",
    color: COLORS.goldSoft,
    fontSize: 42,
    letterSpacing: -1.7,
    lineHeight: 46,
    textAlign: "center",
  },
  brandSubtitle: {
    maxWidth: 420,
    marginTop: 22,
    color: "rgba(255, 255, 255, 0.66)",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },

  /* Card (.form-section-card) */
  card: {
    marginHorizontal: 12,
    marginTop: -34,
    paddingTop: 22,
    paddingHorizontal: 18,
    paddingBottom: 24,
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
  cardTitle: {
    marginBottom: 22,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.7,
  },

  /* Banner */
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  bannerError: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  bannerInfo: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.infoBorder,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  bannerTextError: { color: COLORS.red },
  bannerTextInfo: { color: COLORS.green },

  /* Field (.input-box) */
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 7,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.control,
    backgroundColor: "#FFFFFF",
  },
  inputRowFocused: {
    borderColor: "rgba(36, 72, 58, 0.45)",
    // focus ring (box-shadow 0 0 0 4px) – iOS only; Android ignores shadows on non-elevated views
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  inputRowError: {
    borderColor: "rgba(185, 78, 72, 0.55)",
    backgroundColor: "rgba(185, 78, 72, 0.04)",
  },
  input: {
    flex: 1,
    height: "100%",
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  rightAction: {
    marginLeft: 12,
  },
  rightActionText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  fieldError: {
    marginTop: 4,
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "600",
  },

  /* Button (.confirm-btn-primary) */
  button: {
    minHeight: 54,
    marginTop: 8,
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
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});