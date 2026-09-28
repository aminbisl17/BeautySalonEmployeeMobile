import { Client } from "@stomp/stompjs";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import SockJS from "sockjs-client";

const API_WS = Constants.expoConfig?.extra?.API_WS;

let stompClient = null;
let connectionPromise = null;

/* =========================================================
   STOMP CONNECTION
   ========================================================= */

export function connectWebSocket() {
  if (!API_WS) {
    return Promise.reject(
      new Error("API_WS is missing from Expo configuration!"),
    );
  }

  // Already connected
  if (stompClient && stompClient.connected) {
    console.log("✅ STOMP already connected");
    return Promise.resolve(stompClient);
  }

  // Already connecting
  if (connectionPromise) {
    console.log("⏳ STOMP connection already in progress");
    return connectionPromise;
  }

  console.log("=================================");
  console.log("🔌 STARTING SOCKJS + STOMP");
  console.log("URL:", API_WS);
  console.log("=================================");

  connectionPromise = new Promise((resolve, reject) => {
    let settled = false;
    let client = null;

    const failConnection = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      connectionPromise = null;

      if (stompClient === client) {
        stompClient = null;
      }

      console.error("❌ STOMP connection failed:", error);

      reject(error);
    };

    client = new Client({
      /*
       * IMPORTANT:
       *
       * API_WS is:
       * wss://.../ws
       *
       * SockJS needs the HTTP endpoint instead:
       * https://.../ws
       */

      webSocketFactory: () => {
        const sockJsUrl = API_WS.replace(/^wss:\/\//, "https://").replace(
          /^ws:\/\//,
          "http://",
        );

        console.log("🔌 Creating SockJS connection:", sockJsUrl);

        const socket = new SockJS(sockJsUrl);

        socket.onopen = () => {
          console.log("🟢 SOCKJS OPEN");
        };

        socket.onmessage = (event) => {
          console.log("📨 SOCKJS MESSAGE:", event.data);
        };

        socket.onerror = (event) => {
          console.error("🔴 SOCKJS ERROR:", event);
        };

        socket.onclose = (event) => {
          console.log("⚫ SOCKJS CLOSED:", event);
        };

        return socket;
      },

      /*
       * No authentication is required by /ws.
       */
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,

      /*
       * Reconnect after an established connection
       * is lost.
       */
      reconnectDelay: 5000,

      debug: (message) => {
        console.log("[STOMP]", message);
      },

      onConnect: (frame) => {
        console.log("=================================");
        console.log("🔥 STOMP CONNECTED");
        console.log("STOMP VERSION:", frame.headers?.version);
        console.log("=================================");

        settled = true;

        stompClient = client;
        connectionPromise = null;

        resolve(client);
      },

      onStompError: (frame) => {
        console.error("🔥 STOMP ERROR");

        console.error("Message:", frame.headers?.message);

        console.error("Body:", frame.body);

        failConnection(
          new Error(frame.headers?.message || "STOMP connection failed"),
        );
      },

      onWebSocketError: (error) => {
        console.error("🔴 SOCKJS/STOMP ERROR:", error);

        failConnection(
          error instanceof Error ? error : new Error("SockJS connection error"),
        );
      },

      onWebSocketClose: (event) => {
        console.log("⚫ SOCKJS/STOMP CLOSED");

        if (!settled) {
          failConnection(new Error("SockJS closed before STOMP connection"));
        }
      },

      onDisconnect: () => {
        console.log("🔌 STOMP DISCONNECTED");
      },
    });

    stompClient = client;

    console.log("🚀 Activating STOMP client...");

    client.activate();
  });

  return connectionPromise;
}

/* =========================================================
   EMPLOYEE APPOINTMENT SUBSCRIPTION
   ========================================================= */

export async function subscribeEmployeeAppointments(onAppointmentsUpdate) {
  try {
    /*
     * Wait for the global connection if it is
     * still being established.
     */
    if (connectionPromise) {
      console.log("⏳ Waiting for STOMP connection...");

      await connectionPromise;
    }

    /*
     * Verify connection.
     */
    if (!stompClient || !stompClient.connected) {
      console.error("❌ STOMP is not connected");

      return null;
    }

    /*
     * Get employee information.
     */
    const data = await SecureStore.getItemAsync("userDetails");

    if (!data) {
      console.error("❌ userDetails not found in SecureStore");

      return null;
    }

    const userDetails = JSON.parse(data);

    const employeeId = userDetails.ID ?? userDetails.id;

    console.log("👤 Employee ID:", employeeId);

    if (!employeeId) {
      console.error("❌ Employee ID not found");

      return null;
    }

    /*
     * Spring destination.
     */
    const destination = `/topic/appointments/employee/${employeeId}`;

    console.log("📡 Subscribing to:", destination);

    const subscription = stompClient.subscribe(destination, (message) => {
      try {
        console.log("📨 Appointment update received");

        if (!message?.body) {
          console.warn("⚠️ Appointment message has empty body");

          return;
        }

        const appointments = JSON.parse(message.body);

        console.log("📅 Updated appointments:", appointments);

        onAppointmentsUpdate(appointments);
      } catch (error) {
        console.error("❌ Failed to parse appointment update:", error);
      }
    });

    console.log("✅ Appointment subscription created");

    return subscription;
  } catch (error) {
    console.error("❌ Failed to subscribe to employee appointments:", error);

    return null;
  }
}

/* =========================================================
   DISCONNECT
   ========================================================= */

export async function disconnectWebSocket() {
  console.log("🔌 Disconnecting STOMP...");

  connectionPromise = null;

  if (!stompClient) {
    console.log("ℹ️ No STOMP connection");

    return;
  }

  try {
    await stompClient.deactivate();
  } catch (error) {
    console.error("❌ Error disconnecting STOMP:", error);
  } finally {
    stompClient = null;

    console.log("✅ STOMP disconnected");
  }
}
