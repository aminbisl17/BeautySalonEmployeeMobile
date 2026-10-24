import { COLORS, RADIUS, SERIF } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  badge: string;
  title?: string;
  titleSerif?: string;
  subtitle?: string;
  onBack?: () => void;
  children?: ReactNode;
};

export function ScreenHeader({
  badge,
  title,
  titleSerif,
  subtitle,
  onBack,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.zone, { paddingTop: insets.top + 16 }]}>
      <StatusBar style="light" />

      {onBack ? (
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Kthehu"
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.goldLight} />
          </Pressable>
        </View>
      ) : (
        <View style={{ height: 24 }} />
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>

      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!titleSerif && <Text style={styles.serif}>{titleSerif}</Text>}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {children}
    </View>
  );
}

/** Shared screen shell: black behind (pull-to-refresh blends with the band), cream content. */
export const screen = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { flexGrow: 1, backgroundColor: COLORS.cream, paddingBottom: 48 },
  body: { marginHorizontal: 12, marginTop: -34 },
});

const styles = StyleSheet.create({
  zone: {
    alignItems: "center",
    backgroundColor: COLORS.black,
    paddingHorizontal: 22,
    paddingBottom: 74,
  },
  topRow: { alignSelf: "stretch", flexDirection: "row", marginBottom: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  pressed: { transform: [{ scale: 0.92 }] },
  badge: {
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(182, 150, 99, 0.4)",
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    color: COLORS.goldSoft,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  title: {
    color: "#F7F5EF",
    fontSize: 42,
    fontWeight: "500",
    letterSpacing: -2.5,
    lineHeight: 42,
    textAlign: "center",
  },
  serif: {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontWeight: "400",
    color: COLORS.goldSoft,
    fontSize: 42,
    letterSpacing: -1.7,
    lineHeight: 46,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 320,
    marginTop: 22,
    color: "rgba(255, 255, 255, 0.66)",
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
  },
});