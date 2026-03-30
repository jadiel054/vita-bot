import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  PAYMENT_CONFIG,
  generatePixPayload,
  getWhatsAppSalesLink,
} from "@/constants/payment-config";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  badge?: string;
  description: string;
  features: Array<{ label: string; included: boolean }>;
  cta: string;
  highlight: boolean;
  checkoutLink?: string;
};

// ─── Plans Data ───────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    priceValue: 0,
    period: "",
    description: "Para clínicas que querem experimentar o VitaBot",
    features: [
      { label: "50 conversas por mês", included: true },
      { label: "1 médico cadastrado", included: true },
      { label: "Agendamento básico", included: true },
      { label: "Informações da clínica", included: true },
      { label: "Lembretes automáticos", included: false },
      { label: "Múltiplos médicos", included: false },
      { label: "Analytics avançado", included: false },
      { label: "Múltiplas clínicas", included: false },
      { label: "Suporte prioritário", included: false },
    ],
    cta: "Começar Grátis",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 197",
    priceValue: 197,
    period: "/mês",
    badge: "Mais Popular",
    description: "Para clínicas em crescimento com equipe médica",
    features: [
      { label: "Conversas ilimitadas", included: true },
      { label: "Até 5 médicos", included: true },
      { label: "Agendamento completo", included: true },
      { label: "Informações da clínica", included: true },
      { label: "Lembretes automáticos", included: true },
      { label: "Lista de espera", included: true },
      { label: "Analytics básico", included: true },
      { label: "Múltiplas clínicas", included: false },
      { label: "Suporte prioritário", included: false },
    ],
    cta: "Assinar Pro",
    highlight: true,
    checkoutLink: PAYMENT_CONFIG.checkoutLinks.pro,
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 397",
    priceValue: 397,
    period: "/mês",
    badge: "Completo",
    description: "Para redes de clínicas e hospitais",
    features: [
      { label: "Conversas ilimitadas", included: true },
      { label: "Médicos ilimitados", included: true },
      { label: "Agendamento completo", included: true },
      { label: "Informações da clínica", included: true },
      { label: "Lembretes automáticos", included: true },
      { label: "Lista de espera", included: true },
      { label: "Analytics completo", included: true },
      { label: "Múltiplas clínicas", included: true },
      { label: "Suporte prioritário", included: true },
    ],
    cta: "Assinar Premium",
    highlight: false,
    checkoutLink: PAYMENT_CONFIG.checkoutLinks.premium,
  },
];

// ─── PIX Modal ────────────────────────────────────────────────────────────────

function PixModal({
  visible,
  plan,
  onClose,
  colors,
}: {
  visible: boolean;
  plan: Plan | null;
  onClose: () => void;
  colors: any;
}) {
  const [copied, setCopied] = useState(false);

  if (!plan || plan.priceValue === 0) return null;

  // Clipboard helper compatível com web e nativo (sem dependências externas)
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        // Web moderno: usa Clipboard API nativa do browser
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        // Fallback web legado: cria textarea temporário
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      // Em nativo (iOS/Android), o usuário pode copiar manualmente selecionando o texto
    } catch {
      // Silently fail
    }
  };

  const pixPayload = generatePixPayload(
    PAYMENT_CONFIG.pixKey,
    PAYMENT_CONFIG.pixReceiverName,
    PAYMENT_CONFIG.pixCity,
    plan.priceValue,
    `VitaBot ${plan.name}`
  );

  const handleCopyPix = async () => {
    await copyToClipboard(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    const link = getWhatsAppSalesLink(plan.name, plan.price);
    Linking.openURL(link).catch(() => {
      Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={pixStyles.overlay}>
        <View style={[pixStyles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[pixStyles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={pixStyles.sheetHeader}>
            <View>
              <Text style={[pixStyles.sheetTitle, { color: colors.foreground }]}>
                Assinar Plano {plan.name}
              </Text>
              <Text style={[pixStyles.sheetSubtitle, { color: colors.muted }]}>
                {plan.price}{plan.period} • Pagamento seguro
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [pixStyles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
            >
              <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* PIX Section */}
            <View style={[pixStyles.section, { borderColor: colors.border }]}>
              <View style={pixStyles.sectionHeader}>
                <View style={[pixStyles.sectionIcon, { backgroundColor: colors.primary + "20" }]}>
                  <IconSymbol name="qrcode" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[pixStyles.sectionTitle, { color: colors.foreground }]}>Pagar via PIX</Text>
                  <Text style={[pixStyles.sectionDesc, { color: colors.muted }]}>Aprovação instantânea</Text>
                </View>
              </View>

              {/* PIX Key Display */}
              <View style={[pixStyles.pixKeyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[pixStyles.pixKeyLabel, { color: colors.muted }]}>Chave PIX</Text>
                <Text style={[pixStyles.pixKeyValue, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="middle">
                  {PAYMENT_CONFIG.pixKey}
                </Text>
              </View>

              {/* PIX Code */}
              <View style={[pixStyles.pixCodeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[pixStyles.pixCodeLabel, { color: colors.muted }]}>Código PIX Copia e Cola</Text>
                <Text style={[pixStyles.pixCode, { color: colors.foreground }]} numberOfLines={3}>
                  {pixPayload}
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  pixStyles.copyBtn,
                  { backgroundColor: copied ? colors.success : colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleCopyPix}
              >
                <IconSymbol
                  name={copied ? "checkmark.circle.fill" : "doc.on.doc.fill"}
                  size={18}
                  color="#0B1628"
                />
                <Text style={pixStyles.copyBtnText}>
                  {copied ? "Código Copiado!" : "Copiar Código PIX"}
                </Text>
              </Pressable>

              <View style={[pixStyles.pixInstructions, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Text style={[pixStyles.pixInstructionsTitle, { color: colors.primary }]}>Como pagar:</Text>
                <Text style={[pixStyles.pixInstructionsText, { color: colors.muted }]}>
                  1. Abra o app do seu banco{"\n"}
                  2. Acesse a área PIX{"\n"}
                  3. Escolha "Copia e Cola" ou escaneie o QR Code{"\n"}
                  4. Cole o código acima e confirme o pagamento{"\n"}
                  5. Envie o comprovante via WhatsApp
                </Text>
              </View>
            </View>

            {/* Checkout Link — if configured */}
            {plan.checkoutLink ? (
              <View style={[pixStyles.section, { borderColor: colors.border }]}>
                <View style={pixStyles.sectionHeader}>
                  <View style={[pixStyles.sectionIcon, { backgroundColor: colors.warning + "20" }]}>
                    <IconSymbol name="creditcard.fill" size={20} color={colors.warning} />
                  </View>
                  <View>
                    <Text style={[pixStyles.sectionTitle, { color: colors.foreground }]}>Cartão de Crédito</Text>
                    <Text style={[pixStyles.sectionDesc, { color: colors.muted }]}>Parcelamento disponível</Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    pixStyles.checkoutBtn,
                    { borderColor: colors.warning, backgroundColor: colors.warning + "10" },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => Linking.openURL(plan.checkoutLink!)}
                >
                  <IconSymbol name="arrow.up.right.square.fill" size={18} color={colors.warning} />
                  <Text style={[pixStyles.checkoutBtnText, { color: colors.warning }]}>
                    Pagar com Cartão
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* WhatsApp Contact */}
            <View style={[pixStyles.section, { borderColor: colors.border }]}>
              <View style={pixStyles.sectionHeader}>
                <View style={[pixStyles.sectionIcon, { backgroundColor: "#25D36620" }]}>
                  <IconSymbol name="message.fill" size={20} color="#25D366" />
                </View>
                <View>
                  <Text style={[pixStyles.sectionTitle, { color: colors.foreground }]}>Falar com Vendas</Text>
                  <Text style={[pixStyles.sectionDesc, { color: colors.muted }]}>Tire dúvidas antes de assinar</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  pixStyles.whatsappBtn,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleWhatsApp}
              >
                <IconSymbol name="message.fill" size={18} color="#fff" />
                <Text style={pixStyles.whatsappBtnText}>Conversar no WhatsApp</Text>
              </Pressable>
            </View>

            {/* Security Footer */}
            <View style={[pixStyles.securityFooter, { borderColor: colors.border }]}>
              <IconSymbol name="lock.fill" size={14} color={colors.muted} />
              <Text style={[pixStyles.securityText, { color: colors.muted }]}>
                Pagamento 100% seguro • Dados criptografados • Conforme LGPD
              </Text>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const colors = useColors();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);

  const handleSelect = (plan: Plan) => {
    if (plan.id === "free") {
      Alert.alert(
        "Plano Gratuito",
        "Você já está utilizando o plano gratuito do VitaBot. Para mais recursos, considere fazer upgrade para o plano Pro ou Premium.",
        [{ text: "OK" }]
      );
    } else {
      setSelectedPlan(plan);
      setShowPixModal(true);
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
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Planos VitaBot</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Escolha o plano ideal para sua clínica
          </Text>
          <Text style={[styles.heroSub, { color: colors.muted }]}>
            Automatize sua recepção e melhore a experiência dos seus pacientes
          </Text>
        </View>

        {/* Payment Methods Banner */}
        <View style={[styles.paymentBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.paymentBannerTitle, { color: colors.foreground }]}>Formas de pagamento aceitas</Text>
          <View style={styles.paymentMethods}>
            <View style={[styles.paymentMethod, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="qrcode" size={16} color={colors.primary} />
              <Text style={[styles.paymentMethodText, { color: colors.primary }]}>PIX</Text>
            </View>
            <View style={[styles.paymentMethod, { backgroundColor: colors.warning + "15" }]}>
              <IconSymbol name="creditcard.fill" size={16} color={colors.warning} />
              <Text style={[styles.paymentMethodText, { color: colors.warning }]}>Cartão</Text>
            </View>
            <View style={[styles.paymentMethod, { backgroundColor: "#25D36615" }]}>
              <IconSymbol name="message.fill" size={16} color="#25D366" />
              <Text style={[styles.paymentMethodText, { color: "#25D366" }]}>WhatsApp</Text>
            </View>
          </View>
        </View>

        {/* Plans */}
        {PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              {
                backgroundColor: plan.highlight ? colors.primary + "10" : colors.surface,
                borderColor: plan.highlight ? colors.primary : colors.border,
                borderWidth: plan.highlight ? 2 : 1,
              },
            ]}
          >
            {plan.badge && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: plan.highlight ? colors.primary : colors.foreground }]}>
                  {plan.price}
                </Text>
                {plan.period && (
                  <Text style={[styles.planPeriod, { color: colors.muted }]}>{plan.period}</Text>
                )}
              </View>
              <Text style={[styles.planDesc, { color: colors.muted }]}>{plan.description}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.featuresList}>
              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <IconSymbol
                    name={feature.included ? "checkmark.circle.fill" : "xmark.circle.fill"}
                    size={18}
                    color={feature.included ? colors.success : colors.border}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      { color: feature.included ? colors.foreground : colors.muted },
                    ]}
                  >
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.ctaBtn,
                {
                  backgroundColor: plan.highlight ? colors.primary : colors.surface,
                  borderColor: plan.highlight ? colors.primary : colors.border,
                  borderWidth: 1.5,
                },
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => handleSelect(plan)}
            >
              {plan.id !== "free" && (
                <IconSymbol
                  name="qrcode"
                  size={16}
                  color={plan.highlight ? "#0B1628" : colors.foreground}
                />
              )}
              <Text
                style={[
                  styles.ctaText,
                  { color: plan.highlight ? "#0B1628" : colors.foreground },
                ]}
              >
                {plan.cta}
              </Text>
            </Pressable>
          </View>
        ))}

        {/* LGPD Note */}
        <View style={[styles.lgpdCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="lock.fill" size={16} color={colors.primary} />
          <Text style={[styles.lgpdText, { color: colors.muted }]}>
            Todos os planos incluem conformidade com a LGPD, criptografia de dados e suporte em português.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* PIX Payment Modal */}
      <PixModal
        visible={showPixModal}
        plan={selectedPlan}
        onClose={() => {
          setShowPixModal(false);
          setSelectedPlan(null);
        }}
        colors={colors}
      />
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  content: { padding: 16 },
  hero: { alignItems: "center", paddingVertical: 20, gap: 8, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  paymentBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  paymentBannerTitle: { fontSize: 13, fontWeight: "600" },
  paymentMethods: { flexDirection: "row", gap: 8 },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentMethodText: { fontSize: 13, fontWeight: "600" },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#0B1628", fontSize: 11, fontWeight: "700" },
  planHeader: { gap: 6, marginBottom: 16 },
  planName: { fontSize: 20, fontWeight: "800" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: { fontSize: 32, fontWeight: "800" },
  planPeriod: { fontSize: 14 },
  planDesc: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginBottom: 16 },
  featuresList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 14 },
  ctaBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { fontSize: 15, fontWeight: "700" },
  lgpdCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  lgpdText: { flex: 1, fontSize: 13, lineHeight: 18 },
});

const pixStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  sheetSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionDesc: { fontSize: 12, marginTop: 2 },
  pixKeyBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  pixKeyLabel: { fontSize: 11, fontWeight: "600" },
  pixKeyValue: { fontSize: 14, fontWeight: "600" },
  pixCodeBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  pixCodeLabel: { fontSize: 11, fontWeight: "600" },
  pixCode: { fontSize: 11, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", lineHeight: 16 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyBtnText: { color: "#0B1628", fontSize: 15, fontWeight: "700" },
  pixInstructions: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  pixInstructionsTitle: { fontSize: 13, fontWeight: "700" },
  pixInstructionsText: { fontSize: 13, lineHeight: 20 },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  checkoutBtnText: { fontSize: 15, fontWeight: "700" },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#25D366",
  },
  whatsappBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  securityFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
