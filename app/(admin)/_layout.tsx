import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { isAdminLoggedIn } from "@/lib/store";

/**
 * Layout do painel administrativo com proteção de rotas.
 * Redireciona para o login se o admin não estiver autenticado.
 */
export default function AdminLayout() {
  const segments = useSegments();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isAdminLoggedIn();
      setAuthenticated(loggedIn);
      setChecking(false);

      // Se não está na tela de login e não está autenticado, redireciona
      const currentScreen = segments[segments.length - 1];
      if (!loggedIn && currentScreen !== "login") {
        router.replace("/(admin)/login" as any);
      }
    };

    checkAuth();
  }, [segments]);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B1628", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#22D3EE" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B1628" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="doctors" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="ai-settings" />
    </Stack>
  );
}
