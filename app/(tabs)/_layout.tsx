
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.goldLight,
        tabBarInactiveTintColor: "rgba(247, 245, 240, 0.48)",

        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopWidth: 1,
          borderTopColor: "rgba(182, 150, 99, 0.18)",
          height: 78,
          paddingTop: 9,
          paddingBottom: 10,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginTop: 3,
        },

        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profili",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Home"
        options={{
          title: "Ballina",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="QrScanner"
        options={{
          title: "Skaneri",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
