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
          } else if (route.name === "Profile") {
            iconName = "person-outline";
          } else {
            iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profili",
        }}
      />

      <Tabs.Screen
        name="Home"
        options={{
          title: "Ballina",
        }}
      />
      <Tabs.Screen
        name="QrScanner"
        options={{
          title: "Skaneri",
        }}
      />
      <Tabs.Screen
        name="AvailableDates"
        options={{
          href: null,
          title: "Kalendari",
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          href: null,
          title: "Aftesite",
        }}
      />

      <Tabs.Screen
        name="Terminet"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
