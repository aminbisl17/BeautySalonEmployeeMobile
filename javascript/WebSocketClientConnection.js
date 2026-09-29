import { Client } from "@stomp/stompjs";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import SockJS from "sockjs-client";

const API_WS = Constants.expoConfig?.extra?.API_WS;

let stompClient = null;
let connectionPromise = null;

export function connectWebSocket() {
  if (!API_WS) {
    return Promise.reject(
      new Error("API_WS is missing from Expo configuration!"),
    );
  }

  if (stompClient && stompClient.connected) {
    console.log("STOMP already connected");
    return Promise.resolve(stompClient);
  }
  if (connectionPromise) {
    return connectionPromise;
  }

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

      console.error(" STOMP connection failed:", error);

      reject(error);
    };

    client = new Client({
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
          //    console.log("📨 SOCKJS MESSAGE:", event.data);
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
        settled = true;

        stompClient = client;
        connectionPromise = null;

        resolve(client);
      },

      onStompError: (frame) => {
        console.error("Message:", frame.headers?.message);

        console.error("Body:", frame.body);

        failConnection(
          new Error(frame.headers?.message || "STOMP connection failed"),
        );
      },

      onWebSocketError: (error) => {
        console.error("SOCKJS/STOMP ERROR:", error);

        failConnection(
          error instanceof Error ? error : new Error("SockJS connection error"),
        );
      },

      onWebSocketClose: (event) => {
        console.log("SOCKJS/STOMP CLOSED");

        if (!settled) {
          failConnection(new Error("SockJS closed before STOMP connection"));
        }
      },

      onDisconnect: () => {
        console.log("🔌 STOMP DISCONNECTED");
      },
    });

    stompClient = client;

    client.activate();
  });

  return connectionPromise;
}

export async function subscribeEmployeeAppointments(onAppointmentsUpdate) {
  try {
    if (connectionPromise) {
      console.log("⏳ Waiting for STOMP connection...");

      await connectionPromise;
    }

    if (!stompClient || !stompClient.connected) {
      console.error("STOMP is not connected");

      return null;
    }

    const data = await SecureStore.getItemAsync("userDetails");

    if (!data) {
      console.error("userDetails not found in SecureStore");

      return null;
    }

    const userDetails = JSON.parse(data);

    const employeeId = userDetails.ID ?? userDetails.id;

    if (!employeeId) {
      console.error("Employee ID not found");

      return null;
    }

    const destination = `/topic/appointments/employee/${employeeId}`;

    console.log("Subscribing to:", destination);

    const subscription = stompClient.subscribe(destination, (message) => {
      try {
        if (!message?.body) {
          console.warn("Appointment message has empty body");

          return;
        }

        const appointments = JSON.parse(message.body);

        onAppointmentsUpdate(appointments);
      } catch (error) {
        console.error("Failed to parse appointment update:", error);
      }
    });

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe to employee appointments:", error);

    return null;
  }
}

export async function disconnectWebSocket() {
  console.log("🔌 Disconnecting STOMP...");

  connectionPromise = null;

  if (!stompClient) {
    return;
  }

  try {
    await stompClient.deactivate();
  } catch (error) {
    console.error(" Error disconnecting STOMP:", error);
  } finally {
    stompClient = null;

    console.log("STOMP disconnected");
  }
}
