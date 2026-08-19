import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <IconSymbol name="wifi.slash" size={16} color="#0B1628" />
      <Text style={styles.text}>
        Você está offline. Algumas funcionalidades podem estar indisponíveis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 10000,
  },
  text: {
    color: "#0B1628",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});
