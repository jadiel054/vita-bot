import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getClinic, saveClinic, type ClinicSettings } from "@/lib/store";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  colors: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
          multiline && { minHeight: 80, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

export default function AdminSettingsScreen() {
  const colors = useColors();
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClinic().then(setClinic);
  }, []);

  const update = (key: keyof ClinicSettings, value: any) => {
    setClinic((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const updateHours = (key: keyof ClinicSettings["openingHours"], value: string) => {
    setClinic((prev) =>
      prev ? { ...prev, openingHours: { ...prev.openingHours, [key]: value } } : prev
    );
  };

  const handleSave = async () => {
    if (!clinic) return;
    setSaving(true);
    try {
      await saveClinic(clinic);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Salvo!", "As configurações da clínica foram atualizadas com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (!clinic) return null;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Configurações</Text>
        <Pressable
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "..." : "Salvar"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>IDENTIDADE DA CLÍNICA</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Nome da Clínica" value={clinic.name} onChangeText={(v) => update("name", v)} placeholder="Nome da clínica" colors={colors} />
            <Field label="E-mail" value={clinic.email} onChangeText={(v) => update("email", v)} placeholder="contato@clinica.com.br" keyboardType="email-address" colors={colors} />
            <Field label="Telefone" value={clinic.phone} onChangeText={(v) => update("phone", v)} placeholder="(11) 3000-0000" keyboardType="phone-pad" colors={colors} />
            <Field label="WhatsApp" value={clinic.whatsapp} onChangeText={(v) => update("whatsapp", v)} placeholder="(11) 99000-0000" keyboardType="phone-pad" colors={colors} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.primary }]}>ENDEREÇO</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Endereço" value={clinic.address} onChangeText={(v) => update("address", v)} placeholder="Av. Paulista, 1000 — Sala 502" colors={colors} />
            <Field label="Bairro" value={clinic.neighborhood} onChangeText={(v) => update("neighborhood", v)} placeholder="Bela Vista" colors={colors} />
            <Field label="Cidade" value={clinic.city} onChangeText={(v) => update("city", v)} placeholder="São Paulo" colors={colors} />
            <Field label="Como chegar" value={clinic.howToGetThere} onChangeText={(v) => update("howToGetThere", v)} placeholder="Instruções de acesso..." colors={colors} multiline />
            <Field label="Estacionamento" value={clinic.parkingInfo} onChangeText={(v) => update("parkingInfo", v)} placeholder="Informações sobre estacionamento..." colors={colors} multiline />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.primary }]}>HORÁRIOS DE FUNCIONAMENTO</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field label="Dias úteis" value={clinic.openingHours.weekdays} onChangeText={(v) => updateHours("weekdays", v)} placeholder="Segunda a Sexta: 07h às 19h" colors={colors} />
            <Field label="Sábado" value={clinic.openingHours.saturday} onChangeText={(v) => updateHours("saturday", v)} placeholder="Sábado: 08h às 13h" colors={colors} />
            <Field label="Domingo" value={clinic.openingHours.sunday} onChangeText={(v) => updateHours("sunday", v)} placeholder="Domingo: Fechado" colors={colors} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveFullBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color="#0B1628" />
            <Text style={styles.saveFullBtnText}>{saving ? "Salvando..." : "Salvar Configurações"}</Text>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: "#0B1628", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: 4, marginLeft: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14, marginBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  saveFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  saveFullBtnText: { color: "#0B1628", fontSize: 16, fontWeight: "700" },
});
