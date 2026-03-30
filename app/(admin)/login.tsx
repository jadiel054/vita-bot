import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { setAdminLoggedIn, saveAdminSession } from "@/lib/store";
import { verifyAdminCredentials } from "@/constants/admin-config";

export default function AdminLoginScreen() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    // Pequeno delay para simular verificação segura
    await new Promise((r) => setTimeout(r, 600));

    const admin = verifyAdminCredentials(email.trim(), password);

    if (admin) {
      await setAdminLoggedIn(true);
      // Salva sessão com dados do admin (nome, role, email)
      await saveAdminSession({
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permanent: admin.permanent,
        loginAt: new Date().toISOString(),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace("/(admin)/dashboard" as any);
    } else {
      setLoading(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        "Acesso negado",
        "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente."
      );
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Back Button */}
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={22} color={colors.muted} />
            <Text style={[styles.backText, { color: colors.muted }]}>Voltar</Text>
          </Pressable>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>V</Text>
            </View>
            <Text style={[styles.logoTitle, { color: colors.foreground }]}>VitaBot Admin</Text>
            <Text style={[styles.logoSub, { color: colors.muted }]}>
              Painel de Gestão da Clínica
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>E-mail</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name="envelope.fill" size={16} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@clinica.com.br"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Senha</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name="lock.fill" size={16} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <IconSymbol
                    name={showPassword ? ("eye.slash.fill" as any) : ("eye.fill" as any)}
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                { backgroundColor: loading ? colors.border : colors.primary },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <IconSymbol name="arrow.clockwise" size={18} color={colors.muted} />
                  <Text style={[styles.loginBtnText, { color: colors.muted }]}>Verificando...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <IconSymbol name="lock.open.fill" size={18} color="#0B1628" />
                  <Text style={styles.loginBtnText}>Entrar no Painel</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Security Note */}
          <View style={[styles.securityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="shield.fill" size={16} color={colors.primary} />
            <Text style={[styles.securityText, { color: colors.muted }]}>
              Acesso restrito a administradores autorizados. Todas as ações são registradas para auditoria.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 16 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
    alignSelf: "flex-start",
  },
  backText: { fontSize: 15 },
  logoSection: { alignItems: "center", marginBottom: 32, gap: 10 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#0B1628", fontSize: 32, fontWeight: "800" },
  logoTitle: { fontSize: 24, fontWeight: "800" },
  logoSub: { fontSize: 14 },
  form: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 18,
    marginBottom: 20,
  },
  fieldContainer: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  loginBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginBtnText: { color: "#0B1628", fontSize: 16, fontWeight: "700" },
  securityCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
