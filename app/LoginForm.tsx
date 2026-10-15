import Constants from "expo-constants";
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
        <View style={styles.headerZone}>
          <Text style={styles.brandTitle}>BeautySalon</Text>
          <Text style={styles.brandSubtitle}>Portali i Stafit</Text>
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

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  muted: "#64748B",
  placeholder: "#94A3B8",
  primary: "#4F46E5",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  infoBg: "#EEF2FF",
  infoBorder: "#C7D2FE",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.muted,
    fontWeight: "500",
  },
  configTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  configText: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  headerZone: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 3,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },

  /* Banner */
  banner: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
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
    fontSize: 14,
    lineHeight: 20,
  },
  bannerTextError: { color: COLORS.danger },
  bannerTextInfo: { color: COLORS.primary },

  /* Field */
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
  },
  inputRowError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: COLORS.text,
  },
  rightAction: {
    marginLeft: 12,
  },
  rightActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.danger,
  },

  /* Button */
  button: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
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