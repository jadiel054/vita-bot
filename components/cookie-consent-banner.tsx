import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { getUserConsent, saveUserConsent } from "@/lib/store";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export function CookieConsentBanner() {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const record = await getUserConsent();
      if (!record || !record.accepted) {
        setVisible(true);
      }
    })();
  }, []);

  if (!visible) return null;

  const handleAccept = async () => {
    await saveUserConsent(true);
    setVisible(false);
  };

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconSymbol name="lock.fill" size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Privacidade e Cookies (LGPD)
          </Text>
          <Text style={[styles.description, { color: colors.muted }]}>
            Utilizamos cookies e tecnologias para melhorar sua experiência e garantir o agendamento seguro de suas consultas. Ao continuar, você concorda com nossos{" "}
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={() => router.push("/terms" as any)}
            >
              Termos de Uso
            </Text>{" "}
            e{" "}
            <Text
              style={{ color: colors.primary, textDecorationLine: "underline" }}
              onPress={() => router.push("/privacy-policy" as any)}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleAccept}
        >
          <Text style={styles.acceptButtonText}>Aceitar e Continuar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flexDirection: "column",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
  },
  acceptButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  acceptButtonText: {
    color: "#0B1628",
    fontWeight: "700",
    fontSize: 14,
  },
});
