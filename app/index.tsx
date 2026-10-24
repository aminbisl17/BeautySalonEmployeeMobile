import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { View } from "react-native";

const TENANT_TOKEN_KEY = "tenantToken"; // must match the key used in VerifyTenant

export default function HomeScreen() {
  const [target, setTarget] = useState<"/LoginForm" | "/VerifyTenant" | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Optional: If you are intentionally clearing it on mount for testing, use the variable:
        await SecureStore.deleteItemAsync(TENANT_TOKEN_KEY);
        
        const token = await SecureStore.getItemAsync(TENANT_TOKEN_KEY);
        console.log("APP: tenant token found?", !!token);
        
        if (mounted) {
          // Since you are deleting the token right above this line, 
          // token will always be null/false here, so it will now correctly go to "/VerifyTenant"
          setTarget(token ? "/LoginForm" : "/VerifyTenant");
        }
      } catch (e) {
        console.error("APP: SecureStore read failed", e);
        if (mounted) setTarget("/VerifyTenant");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // White screen while checking
  if (!target) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  return <Redirect href={target} />;
}