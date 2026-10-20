
import { getPushToken } from "@/javascript/Notification";
import { connectWebSocket } from "@/javascript/WebSocketClientConnection";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
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
    <Stack>
      <Stack.Screen
        name="LoginForm"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
