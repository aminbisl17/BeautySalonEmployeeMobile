import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#007AFF", // active tab color
        tabBarInactiveTintColor: "#8e8e93", // inactive tab color
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 60,
          paddingBottom: 5,
        },
        headerStyle: { backgroundColor: "#f0f2f5" },
        headerTitleStyle: { fontWeight: "bold" },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "QrScanner") {
            iconName = "barcode";
          } else {
            iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Dashboard",
        }}
      />
      <Tabs.Screen
        name="QrScanner"
        options={{
          title: "Scanner",
        }}
      />
    </Tabs>
  );
}
