import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: Array<{ label: string; included: boolean }>;
  cta: string;
  highlight: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
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
  },
  {
    id: "premium",
    name: "Premium",
    price: "R$ 397",
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
  },
];

export default function PlansScreen() {
  const colors = useColors();

  const handleSelect = (plan: Plan) => {
    if (plan.id === "free") {
      Alert.alert(
        "Plano Gratuito",
        "Você já está utilizando o plano gratuito do VitaBot. Para mais recursos, considere fazer upgrade.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        `Assinar ${plan.name}`,
        `Para assinar o plano ${plan.name} por ${plan.price}${plan.period}, entre em contato com nossa equipe comercial.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Entrar em Contato", onPress: () => {} },
        ]
      );
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
  hero: { alignItems: "center", paddingVertical: 20, gap: 8, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
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
