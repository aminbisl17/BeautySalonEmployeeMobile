import { CameraView, useCameraPermissions } from "expo-camera";
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
import { router } from "expo-router";
import { useRef } from "react";
import { validateCode } from "../../javascript/AttendanceAPI";

export default function QRScannerScreen() {
 const lockRef = useRef(false);

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No camera permission</Text>
        <Button title="Allow" onPress={requestPermission} />
      </View>
    );
  }
  const handleScan = async ({ data }: any) => {
    if (lockRef.current) return;

    lockRef.current = true;
    setScanned(true);
    setLoading(true);
    setResult(data);

    try {
      await validateCode({
        code: data,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Something went wrong");
    } finally {
      setLoading(false);

      setTimeout(() => {
        setScanned(false);
        lockRef.current = false;
      }, 2500);
    }
  };
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned || loading ? undefined : handleScan}
      />

      {/* Close button */}
      <View style={{ position: "absolute", top: 50, left: 20 }}>
        <Button title="Close" onPress={() => { router.replace("/Home")}} />
      </View>

      {/* Scan again */}
      {scanned && !loading && (
        <View style={{ position: "absolute", bottom: 50, alignSelf: "center" }}>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="white" />
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
