import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
  getPatients,
  saveUserConsent,
  type Patient,
} from "@/lib/store";
import { isValidCPF, getCPFErrorMessage } from "@/lib/cpf-validator";
import {
  showAlert,
  sanitizeName,
  sanitizeCPF,
  sanitizePhone,
  sanitizeEmail,
} from "@/lib/utils";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
      isValidCPF(cpf) &&
      birthDate.length === 10 &&
      phone.replace(/\D/g, "").length >= 10 &&
      email.includes("@") &&
      acceptedTerms
    );
  };

  const handleSubmit = async () => {
    const cleanName = sanitizeName(fullName);
    const cleanCpfDigits = sanitizeCPF(cpf);
    const cleanPhone = sanitizePhone(phone);
    const cleanWhatsApp = whatsapp ? sanitizePhone(whatsapp) : cleanPhone;
    const cleanEmailStr = sanitizeEmail(email);

    if (cleanName.length < 3) {
      showAlert("Nome inválido", "O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!isValidCPF(cleanCpfDigits)) {
      const errorMsg = getCPFErrorMessage(cleanCpfDigits);
      showAlert("CPF Inválido", errorMsg);
      return;
    }

    if (birthDate.length !== 10) {
      showAlert("Data de nascimento inválida", "Por favor, preencha a data de nascimento corretamente (DD/MM/AAAA).");
      return;
    }

    if (cleanPhone.length < 10) {
      showAlert("Telefone inválido", "O telefone deve ter pelo menos 10 dígitos com DDD.");
      return;
    }

    if (!cleanEmailStr.includes("@")) {
      showAlert("E-mail inválido", "Por favor, digite um endereço de e-mail válido.");
      return;
    }

    if (!acceptedTerms) {
      showAlert("Aceite Obrigatório", "Você precisa aceitar os Termos de Uso e a Política de Privacidade para prosseguir.");
      return;
    }

    setLoading(true);
    try {
      const existingPatients = await getPatients();
      const cpfExists = existingPatients.some(
        (p) => p && p.cpf && p.cpf.replace(/\D/g, "") === cleanCpfDigits
      );

      if (cpfExists) {
        showAlert("CPF já cadastrado", "Este CPF já está registrado em nosso sistema.", [
          { text: "OK", onPress: () => router.push("/booking" as any) },
        ]);
        setLoading(false);
        return;
      }

      const [day, month, year] = birthDate.split("/");
      const isoDate = `${year}-${month}-${day}`;

      const patient: Patient = {
        id: generateId(),
        fullName: cleanName,
        cpf: formatCpf(cleanCpfDigits),
        birthDate: isoDate,
        phone: formatPhone(cleanPhone),
        whatsapp: formatPhone(cleanWhatsApp),
        email: cleanEmailStr,
        healthInsurance,
        howFound,
        createdAt: new Date().toISOString(),
      };

      await addPatient(patient);
      await setCurrentPatientId(patient.id);
      await saveUserConsent(true);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showAlert(
        "✅ Cadastro Realizado!",
        `Bem-vindo(a), ${cleanName.split(" ")[0]}! Seu cadastro foi concluído com sucesso.`,
        [
          {
            text: "Ir para Agendamento",
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/booking" as any);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error("[PatientRegister] Erro ao cadastrar paciente:", err);
      showAlert("Erro", "Não foi possível realizar o cadastro. Tente novamente.");
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
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)" as any);
            }
          }}
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
            <IconSymbol name="lock.fill" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Seus dados são armazenados com segurança e protegidos segundo as normas da LGPD.
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
              label="Telefone com DDD"
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              required
              colors={colors}
              maxLength={15}
            />
            <InputField
              label="WhatsApp (opcional)"
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

          {/* Checkbox de Aceite LGPD / Termos */}
          <Pressable
            style={({ pressed }) => [
              styles.termsRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, { borderColor: acceptedTerms ? colors.primary : colors.border, backgroundColor: acceptedTerms ? colors.primary : "transparent" }]}>
              {acceptedTerms && <IconSymbol name="checkmark" size={14} color="#0B1628" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.termsText, { color: colors.foreground }]}>
                Li e concordo com os{" "}
                <Text
                  style={{ color: colors.primary, textDecorationLine: "underline" }}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push("/terms" as any);
                  }}
                >
                  Termos de Uso
                </Text>{" "}
                e a{" "}
                <Text
                  style={{ color: colors.primary, textDecorationLine: "underline" }}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push("/privacy-policy" as any);
                  }}
                >
                  Política de Privacidade (LGPD)
                </Text>
                . Autorizo o uso de meus dados para agendamentos e mensagens via WhatsApp.
              </Text>
            </View>
          </Pressable>

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: isValid() ? colors.primary : colors.border },
              pressed && isValid() && { transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSubmit}
            disabled={!isValid() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#0B1628" />
            ) : (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color={isValid() ? "#0B1628" : colors.muted} />
                <Text style={[styles.submitBtnText, { color: isValid() ? "#0B1628" : colors.muted }]}>
                  Concluir Cadastro
                </Text>
              </>
            )}
          </Pressable>

          <Text style={[styles.requiredNote, { color: colors.muted }]}>
            * Campos de preenchimento obrigatório
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  termsText: {
    fontSize: 13,
    lineHeight: 18,
  },
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
