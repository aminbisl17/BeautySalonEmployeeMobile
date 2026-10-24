import { Platform } from "react-native";

export const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export const RADIUS = {
  card: 26,
  control: 16,
  pill: 100,
};

export const COLORS = {
  // editorial tokens
  black: "#111311",
  green: "#24483A",
  greenLight: "#E8F0EB",
  cream: "#F7F5F0",
  creamDark: "#ECE8DF",
  gold: "#B69663",
  goldSoft: "#D7C29D",
  goldLight: "#E4CFAA",
  red: "#B94E48",

  // semantic keys
  background: "#F7F5F0",
  surface: "#FFFFFF",
  surfaceAlt: "#FFFFFF",
  border: "rgba(17, 19, 17, 0.09)",
  text: "#171916",
  muted: "#777A73",
  light: "#A2A59E",
  placeholder: "#B8BAB3",
  primary: "#24483A",
  accent: "#B69663",
  danger: "#B94E48",
  dangerBg: "rgba(185, 78, 72, 0.06)",
  dangerBorder: "rgba(185, 78, 72, 0.3)",
  infoBg: "#E8F0EB",
  infoBorder: "rgba(36, 72, 58, 0.2)",
};