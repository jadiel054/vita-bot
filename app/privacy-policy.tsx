import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function PrivacyPolicyScreen() {
  const colors = useColors();

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
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          <Text style={{ color: colors.foreground, marginLeft: 4, fontWeight: "500" }}>Voltar</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Política de Privacidade</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="lock.fill" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              Proteção de Dados e LGPD
            </Text>
            <Text style={[styles.bannerSub, { color: colors.muted }]}>
              Última atualização: Março de 2025
            </Text>
          </View>
        </View>

        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          A <Text style={{ fontWeight: "700" }}>VitaBot / Clínica VitaSaúde</Text> está comprometida com a proteção e privacidade dos seus dados pessoais e de saúde, operando em total conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>1. DADOS PESSOAIS COLETADOS</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Coletamos os seguintes dados exclusivamente para a prestação de serviços de agendamento e atendimento de saúde:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• <Text style={{ fontWeight: "600" }}>Dados de Identificação:</Text> Nome completo, CPF e data de nascimento.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• <Text style={{ fontWeight: "600" }}>Dados de Contato:</Text> Número de telefone, WhatsApp e e-mail.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• <Text style={{ fontWeight: "600" }}>Dados de Saúde e Convênio:</Text> Nome do plano de saúde/convênio e histórico de consultas agendadas.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>2. FINALIDADE DO TRATAMENTO DE DADOS</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Seus dados são utilizados para as seguintes finalidades legítimas:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Agendamento, confirmação, remarcação e cancelamento de consultas médicas.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Envio de lembretes automáticos via WhatsApp ou e-mail sobre suas consultas.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Identificação do paciente na recepção e no prontuário da clínica.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Cumprimento de obrigações legais e regulatórias do setor de saúde.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>3. COMPARTILHAMENTO DE DADOS</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Os seus dados <Text style={{ fontWeight: "700" }}>nunca</Text> serão vendidos ou comercializados. Compartilhamos seus dados apenas com:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Profissionais de saúde responsáveis pelo seu atendimento.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Provedores de serviços de mensageria (como API de WhatsApp) estritamente para o envio de notificações de consulta.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Autoridades públicas quando exigido por lei ou determinação judicial.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>4. ARMAZENAMENTO E SEGURANÇA</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Utilizamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acessos não autorizados, perdas, destruição ou alteração, incluindo criptografia, controle de acesso restrito e servidores seguros.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>5. SEUS DIREITOS COMO TITULAR (ART. 18 DA LGPD)</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Você possui os seguintes direitos em relação aos seus dados pessoais:
        </Text>
        <View style={styles.bulletList}>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Confirmar a existência de tratamento e acessar seus dados.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Solicitar a correção de dados incompletos, inexatos ou desatualizados.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Revogar seu consentimento a qualquer momento.</Text>
          <Text style={[styles.bullet, { color: colors.foreground }]}>• Solicitar a eliminação dos seus dados pessoais mantidos sob seu consentimento (resguardadas as obrigações legais de guarda médica).</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>6. ENCARREGADO DE PROTEÇÃO DE DADOS (DPO)</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato com nosso Encarregado de Dados:
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardText, { color: colors.foreground }]}>• <Text style={{ fontWeight: "600" }}>E-mail:</Text> dpo@vitasaude.com.br</Text>
          <Text style={[styles.cardText, { color: colors.foreground, marginTop: 4 }]}>• <Text style={{ fontWeight: "600" }}>Telefone:</Text> (11) 3000-0000</Text>
        </View>

        <View style={{ height: 32 }} />
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
  headerTitle: { fontSize: 16, fontWeight: "700" },
  backBtn: { flexDirection: "row", alignItems: "center" },
  content: { padding: 16, gap: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  bannerTitle: { fontSize: 16, fontWeight: "700" },
  bannerSub: { fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    gap: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  cardText: {
    fontSize: 13,
  },
});
