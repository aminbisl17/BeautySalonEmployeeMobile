import { connectWebSocket } from "@/javascript/WebSocketClientConnection";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    const setupWebSocket = async () => {
      try {
        console.log("APP: Connecting WebSocket...");

        await connectWebSocket();

        console.log("APP: WebSocket connected");
      } catch (error) {
        console.error("APP: WebSocket connection failed:", error);
      }
    };

    setupWebSocket();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="LoginForm" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
