import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    requestPermission();
  }, []);

  const handleScan = ({ data }) => {
    setScanned(true);
    setResult(data);
    setScanning(false);
  };

  if (!permission) {
    return <Text>Requesting permission...</Text>;
  }

  if (!permission.granted) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!scanning ? (
        <>
          <Button title="Scan QR Code" onPress={() => setScanning(true)} />
          {result ? <Text style={styles.result}>Result: {result}</Text> : null}
        </>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          />

          {scanned && (
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
});
