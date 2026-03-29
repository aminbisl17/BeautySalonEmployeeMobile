import { CameraView, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { validateCode } from "../../javascript/AttendanceAPI";

export default function QRScannerScreen() {
  const lockRef = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    requestPermission();
  }, []);

  const handleScan = async ({ data }) => {
    if (lockRef.current) return; // HARD STOP DUPLICATES

    lockRef.current = true;
    setScanned(true);
    setScanning(false);
    setLoading(true);
    setResult(data);

    try {
      const userDetailsJson = await SecureStore.getItemAsync("userDetails");
      if (!userDetailsJson) throw new Error("User details not found");

      const user = JSON.parse(userDetailsJson);
      const res = await validateCode({
        id: user.ID,
        username: user.username,
        code: data,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("Backend response:", res);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);

      setTimeout(() => {
        setScanned(false);
        lockRef.current = false; // unlock scanner
      }, 3000);
    }
  };

  if (!permission) {
    return <Text>Requesting permission...</Text>;
  }

  if (!permission.granted) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {/* 🔥 LOADING STATE */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text>Validating QR...</Text>
        </View>
      )}

      {!scanning ? (
        <>
          <Button title="Scan QR Code" onPress={() => setScanning(true)} />
          {result ? <Text style={styles.result}>Last QR: {result}</Text> : null}
        </>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned || loading ? undefined : handleScan}
          />

          {scanned && !loading && (
            <Button title="Scan Again" onPress={() => setScanned(false)} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    width: "100%",
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  loading: {
    position: "absolute",
    top: "50%",
    alignItems: "center",
    zIndex: 10,
  },
});
