import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          backgroundColor: "#fff",
          height: 60,
          paddingBottom: 5,
        },
        // Keep tab headers visible so Home, Profile, and QrScanner show their headers!
        headerShown: true, 
        headerStyle: { backgroundColor: "#f0f2f5" },
        headerTitleStyle: { fontWeight: "bold" },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Home") {
            iconName = "home-outline";
          } else if (route.name === "QrScanner") {
            iconName = "barcode";
          } else if (route.name === "Profile") {
            iconName = "person-outline";
          } else {
            iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" options={{ title: "Ballina" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profili" }} />
      <Tabs.Screen name="QrScanner" options={{ title: "Skaneri" }} />
    </Tabs>
  );
}