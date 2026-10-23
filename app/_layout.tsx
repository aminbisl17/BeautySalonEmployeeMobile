import { getPushToken } from "@/javascript/Notification";
import { connectWebSocket } from "@/javascript/WebSocketClientConnection";
import { Stack } from "expo-router";
import { useEffect } from "react";
export default function RootLayout() {
  // ... your useEffect initialization code ...
  useEffect(() => {
    let mounted = true;

    const initializeApp = async () => {
      try {
        console.log("APP: Registering push notifications...");

        const token = await getPushToken();

        if (mounted) {
          console.log("My Expo push token:", token);
        }
      } catch (error) {
        console.error("APP: Push registration failed:", error);
      }

      try {
        console.log("APP: Connecting WebSocket...");

        await connectWebSocket();

        console.log("APP: WebSocket connected");
      } catch (error) {
        console.error("APP: WebSocket connection failed:", error);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f0f2f5" },
        headerTitleStyle: { fontWeight: "bold" },
        headerTintColor: "#000",
      }}
    >
      <Stack.Screen name="LoginForm" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Root stack screens — router.push() will now find these instantly */}
      <Stack.Screen
        name="skills"
        options={{
          headerShown: true,
          title: "Aftësitë",
          headerBackTitle: "Kthehu",
        }}
      />
      <Stack.Screen
        name="Terminet"
        options={{
          headerShown: true,
          title: "Terminet",
          headerBackTitle: "Kthehu",
        }}
      />
    </Stack>
  );
}
