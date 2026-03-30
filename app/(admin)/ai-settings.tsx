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
  Switch,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { 
  getAIConfig, 
  saveAIConfig, 
  setAIApiKey, 
  updateAIProvider,
  toggleAIEnabled,
  type AIConfig 
} from "@/lib/store";

type Provider = "manus" | "openai" | "anthropic" | "groq";

const PROVIDER_INFO: Record<Provider, { label: string; description: string }> = {
  manus: { 
    label: "Manus (Padrão)", 
    description: "Usa o modelo Gemini 2.5 Flash da Manus. Sem custos adicionais." 
  },
  openai: { 
    label: "OpenAI (GPT-4)", 
    description: "Use o ChatGPT 4o Mini. Requer chave de API da OpenAI." 
  },
  anthropic: { 
    label: "Anthropic (Claude)", 
    description: "Use o Claude 3.5 Sonnet. Requer chave de API da Anthropic." 
  },
  groq: { 
    label: "Groq (Mixtral)", 
    description: "Use o Mixtral 8x7B. Requer chave de API do Groq." 
  },
};

function ProviderCard({
  provider,
  isSelected,
  onPress,
  colors,
}: {
  provider: Provider;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.providerCard,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={styles.providerCardContent}>
        <Text
          style={[
            styles.providerLabel,
            { color: isSelected ? "#0B1628" : colors.foreground },
          ]}
        >
          {PROVIDER_INFO[provider].label}
        </Text>
        <Text
          style={[
            styles.providerDescription,
            { color: isSelected ? "#0B4F6C" : colors.muted },
          ]}
        >
          {PROVIDER_INFO[provider].description}
        </Text>
      </View>
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: "#0B1628" }]}>
          <IconSymbol name="checkmark" size={16} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

function ApiKeyField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  colors: any;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <View style={[styles.apiKeyContainer, { borderColor: colors.border }]}>
        <TextInput
          style={[
            styles.apiKeyInput,
            { backgroundColor: colors.background, color: colors.foreground },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={!showKey}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowKey(!showKey)}
        >
          <IconSymbol
            name={showKey ? "eye.slash" : "eye"}
            size={18}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function AISettingsScreen() {
  const colors = useColors();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const syncAIConfig = trpc.vitabot.syncAIConfig.useMutation();

  useEffect(() => {
    getAIConfig().then(setConfig);
  }, []);

  const handleProviderChange = (provider: Provider) => {
    if (config) {
      setConfig({ ...config, provider });
    }
  };

  const handleApiKeyChange = (provider: "openai" | "anthropic" | "groq", key: string) => {
    if (!config) return;
    const newConfig = { ...config };
    if (provider === "openai") newConfig.openaiKey = key;
    if (provider === "anthropic") newConfig.anthropicKey = key;
    if (provider === "groq") newConfig.groqKey = key;
    setConfig(newConfig);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveAIConfig(config);
      await syncAIConfig.mutateAsync(config);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Salvo!",
        `Configurações de IA atualizadas. Provedor: ${PROVIDER_INFO[config.provider].label}`
      );
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Configurações de IA
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Status */}
          <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusLabel, { color: colors.foreground }]}>
                  IA Ativada
                </Text>
                <Text style={[styles.statusDescription, { color: colors.muted }]}>
                  {config.enabled ? "Ativa" : "Desativada"}
                </Text>
              </View>
              <Switch
                value={config.enabled}
                onValueChange={(val) => setConfig({ ...config, enabled: val })}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Provider Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Escolha o Provedor de IA
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.muted }]}>
              Selecione qual modelo de IA deseja usar para o VitaBot
            </Text>
            <View style={styles.providersGrid}>
              {(["manus", "openai", "anthropic", "groq"] as Provider[]).map((provider) => (
                <ProviderCard
                  key={provider}
                  provider={provider}
                  isSelected={config.provider === provider}
                  onPress={() => handleProviderChange(provider)}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* API Keys Section */}
          {config.provider !== "manus" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Chave de API
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.muted }]}>
                Cole sua chave de API para o provedor selecionado
              </Text>

              {config.provider === "openai" && (
                <ApiKeyField
                  label="OpenAI API Key"
                  value={config.openaiKey || ""}
                  onChangeText={(val) => handleApiKeyChange("openai", val)}
                  placeholder="sk-..."
                  colors={colors}
                />
              )}

              {config.provider === "anthropic" && (
                <ApiKeyField
                  label="Anthropic API Key"
                  value={config.anthropicKey || ""}
                  onChangeText={(val) => handleApiKeyChange("anthropic", val)}
                  placeholder="sk-ant-..."
                  colors={colors}
                />
              )}

              {config.provider === "groq" && (
                <ApiKeyField
                  label="Groq API Key"
                  value={config.groqKey || ""}
                  onChangeText={(val) => handleApiKeyChange("groq", val)}
                  placeholder="gsk_..."
                  colors={colors}
                />
              )}

              <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="info.circle" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  Sua chave de API é armazenada localmente no seu dispositivo. Nunca é enviada para servidores externos.
                </Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="lightbulb" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                Dica
              </Text>
              <Text style={[styles.infoDescription, { color: colors.muted }]}>
                Você pode trocar o provedor a qualquer momento. O VitaBot continuará funcionando normalmente.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
            saving && { opacity: 0.5 },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionDescription: {
    fontSize: 13,
  },
  providersGrid: {
    gap: 12,
    marginTop: 12,
  },
  providerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  providerCardContent: {
    flex: 1,
    gap: 4,
  },
  providerLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  providerDescription: {
    fontSize: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    gap: 8,
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  apiKeyContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  apiKeyInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  eyeButton: {
    padding: 10,
    marginRight: 4,
  },
  infoBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#0B1628",
    fontSize: 16,
    fontWeight: "700",
  },
});
