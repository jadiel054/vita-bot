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
import { useState } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  addPatient,
  setCurrentPatientId,
  generateId,
  formatCpf,
  formatPhone,
  type Patient,
} from "@/lib/store";

const INSURANCE_OPTIONS = [
  "Unimed", "Bradesco Saúde", "SulAmérica", "Amil",
  "Porto Seguro", "Hapvida", "NotreDame Intermédica",
  "Particular (sem convênio)",
];

const HOW_FOUND_OPTIONS = [
  "Indicação de amigo/familiar",
  "Google / Internet",
  "Redes sociais",
  "Médico indicou",
  "Passando pela rua",
  "Outro",
];

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
  colors,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  required?: boolean;
  colors: any;
  maxLength?: number;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

function SelectField({
  label,
  options,
  value,
  onSelect,
  required,
  colors,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  required?: boolean;
  colors: any;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={({ pressed }) => [
                styles.optionChip,
                {
                  backgroundColor: value === opt ? colors.primary : colors.surface,
                  borderColor: value === opt ? colors.primary : colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onSelect(opt)}
            >
              <Text style={[styles.optionChipText, { color: value === opt ? "#0B1628" : colors.foreground }]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function PatientRegisterScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [howFound, setHowFound] = useState("");

  const handleCpfChange = (v: string) => setCpf(formatCpf(v));
  const handlePhoneChange = (v: string) => setPhone(formatPhone(v));
  const handleWhatsAppChange = (v: string) => setWhatsapp(formatPhone(v));

  const handleBirthDateChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    const formatted = digits
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2");
    setBirthDate(formatted);
  };

  const isValid = () => {
    return (
      fullName.trim().length >= 3 &&
      cpf.replace(/\D/g, "").length === 11 &&
      birthDate.length === 10 &&
      phone.replace(/\D/g, "").length >= 10 &&
      email.includes("@")
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha todos os campos obrigatórios corretamente.");
      return;
    }

    setLoading(true);
    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = birthDate.split("/");
      const isoDate = `${year}-${month}-${day}`;

      const patient: Patient = {
        id: generateId(),
        fullName: fullName.trim(),
        cpf,
        birthDate: isoDate,
        phone,
        whatsapp: whatsapp || phone,
        email: email.trim(),
        healthInsurance,
        howFound,
        createdAt: new Date().toISOString(),
      };

      await addPatient(patient);
      await setCurrentPatientId(patient.id);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Cadastro realizado!",
        `Bem-vindo(a), ${fullName.split(" ")[0]}! Seu cadastro foi concluído com sucesso.`,
        [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as any) }]
      );
    } catch (err) {
      console.error("[PatientRegister] Erro ao cadastrar paciente:", err);
      Alert.alert("Erro", "Não foi possível realizar o cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="xmark" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Novo Cadastro</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
            <IconSymbol name="lock.fill" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Seus dados são protegidos conforme a LGPD e utilizados apenas para fins médicos.
            </Text>
          </View>

          {/* Dados Pessoais */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>DADOS PESSOAIS</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InputField
              label="Nome Completo"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: Maria da Silva Santos"
              required
              colors={colors}
            />
            <InputField
              label="CPF"
              value={cpf}
              onChangeText={handleCpfChange}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              required
              colors={colors}
              maxLength={14}
            />
            <InputField
              label="Data de Nascimento"
              value={birthDate}
              onChangeText={handleBirthDateChange}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              required
              colors={colors}
              maxLength={10}
            />
          </View>

          {/* Contato */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>CONTATO</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <InputField
              label="Telefone"
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              required
              colors={colors}
              maxLength={15}
            />
            <InputField
              label="WhatsApp (se diferente do telefone)"
              value={whatsapp}
              onChangeText={handleWhatsAppChange}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              colors={colors}
              maxLength={15}
            />
            <InputField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com.br"
              keyboardType="email-address"
              required
              colors={colors}
            />
          </View>

          {/* Convênio */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>CONVÊNIO</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SelectField
              label="Plano de Saúde"
              options={INSURANCE_OPTIONS}
              value={healthInsurance}
              onSelect={setHealthInsurance}
              colors={colors}
            />
          </View>

          {/* Como nos conheceu */}
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>COMO NOS CONHECEU</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SelectField
              label="Como você ficou sabendo da clínica?"
              options={HOW_FOUND_OPTIONS}
              value={howFound}
              onSelect={setHowFound}
              colors={colors}
            />
          </View>

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: isValid() ? colors.primary : colors.border },
              pressed && isValid() && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleSubmit}
            disabled={!isValid() || loading}
          >
            <IconSymbol name="checkmark.circle.fill" size={20} color={isValid() ? "#0B1628" : colors.muted} />
            <Text style={[styles.submitBtnText, { color: isValid() ? "#0B1628" : colors.muted }]}>
              {loading ? "Cadastrando..." : "Concluir Cadastro"}
            </Text>
          </Pressable>

          <Text style={[styles.requiredNote, { color: colors.muted }]}>
            * Campos obrigatórios
          </Text>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  content: { padding: 16 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  fieldContainer: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  optionsRow: { flexDirection: "row", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionChipText: { fontSize: 13, fontWeight: "500" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
  requiredNote: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
