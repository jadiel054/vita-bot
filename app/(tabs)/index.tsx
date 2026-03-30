import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useEffect, useRef, useState, useCallback } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { 
  getClinic, 
  getCurrentPatientId, 
  getPatients, 
  savePatients, 
  setCurrentPatientId,
  generateId,
  getAIConfig
} from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Quick Action Chips ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Agendar consulta", icon: "calendar.badge.plus" as const },
  { label: "Cancelar ou remarcar", icon: "xmark.circle.fill" as const },
  { label: "Informações da clínica", icon: "building.2.fill" as const },
  { label: "Falar com atendente", icon: "headphones" as const },
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.typingDots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: colors.primary }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, colors }: { message: Message; colors: ReturnType<typeof useColors> }) {
  const isBot = message.role === "assistant";
  return (
    <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
      {isBot && (
        <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.botAvatarText}>V</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isBot
            ? [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }]
            : [styles.userBubble, { backgroundColor: colors.primary }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isBot ? colors.foreground : "#0B1628" },
          ]}
        >
          {message.content}
        </Text>
        <Text style={[styles.timestamp, { color: isBot ? colors.muted : "#0B4F6C" }]}>
          {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [clinicName, setClinicName] = useState("Clínica VitaSaúde");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.vitabot.chat.useMutation();
  const syncAIConfig = trpc.vitabot.syncAIConfig.useMutation();

  // Load clinic name and send welcome message
  useEffect(() => {
    (async () => {
      // Sync AI Config with server
      const aiConfig = await getAIConfig();
      await syncAIConfig.mutateAsync(aiConfig);

      const clinic = await getClinic();
      setClinicName(clinic.name);

      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou a VitaBot, assistente virtual da ${clinic.name}. Como posso ajudar você hoje?`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    })();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setShowQuickActions(false);
      setIsTyping(true);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Check for special keywords
      const lowerText = text.toLowerCase();
      if (lowerText.includes("agendar") || lowerText.includes("consulta")) {
        // Navigate to booking after bot response
        setTimeout(() => {
          router.push("/booking" as any);
        }, 2500);
      }

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role as "user" | "assistant",
          content: String(m.content),
        }));

        const result = await chatMutation.mutateAsync({
          messages: history,
          clinicName,
        });

        const botContent = String(result.content);

        // Check for special registration keyword
        if (botContent.includes("PERFEITO_CADASTRO:")) {
          try {
            const dataStr = botContent.split("PERFEITO_CADASTRO:")[1].trim();
            const [name, cpf, birth, phone] = dataStr.split(",").map(s => s.trim());
            
            const patients = await getPatients();
            const newPatient = {
              id: generateId(),
              fullName: name,
              cpf: cpf.replace(/\D/g, ""),
              birthDate: birth,
              phone: phone.replace(/\D/g, ""),
              whatsapp: phone.replace(/\D/g, ""),
              email: "",
              healthInsurance: "Particular",
              howFound: "Chat",
              createdAt: new Date().toISOString(),
            };
            
            patients.push(newPatient);
            await savePatients(patients);
            await setCurrentPatientId(newPatient.id);

            const successMsg: Message = {
              id: (Date.now() + 1).toString(),
              role: "assistant",
              content: `Pronto, ${name}! Seu cadastro foi realizado com sucesso. Agora você já pode agendar sua consulta!`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, successMsg]);
            
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return;
          } catch (e) {
            console.error("Failed to parse registration data:", e);
          }
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: botContent,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, clinicName, chatMutation]
  );

  const handleQuickAction = (label: string) => {
    if (label === "Agendar consulta") {
      sendMessage(label);
    } else if (label === "Cancelar ou remarcar") {
      sendMessage(label);
    } else if (label === "Informações da clínica") {
      router.push("/info" as any);
    } else if (label === "Falar com atendente") {
      sendMessage("ATENDENTE");
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerAvatarText}>V</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>VitaBot</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>Online 24h</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.adminBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push("/admin-login" as any)}
        >
          <IconSymbol name="gear" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <MessageBubble message={item} colors={colors} />}
          ListFooterComponent={
            isTyping ? <TypingIndicator colors={colors} /> : null
          }
        />

        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.quickChip,
                  { backgroundColor: colors.surface, borderColor: colors.primary },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => handleQuickAction(action.label)}
              >
                <IconSymbol name={action.icon} size={16} color={colors.primary} />
                <Text style={[styles.quickChipText, { color: colors.foreground }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: input.trim() ? colors.primary : colors.border },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            <IconSymbol name="paperplane.fill" size={20} color={input.trim() ? "#0B1628" : colors.muted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#0B1628",
    fontSize: 20,
    fontWeight: "800",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: "500",
  },
  adminBtn: {
    padding: 8,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  botRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  botAvatarText: {
    color: "#0B1628",
    fontSize: 14,
    fontWeight: "800",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  userBubble: {
    borderRadius: 18,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  quickActions: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
