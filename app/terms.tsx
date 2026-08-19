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

export default function TermsOfUseScreen() {
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Termos de Uso</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="doc.text.fill" size={32} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
              Termos e Condições de Uso
            </Text>
            <Text style={[styles.bannerSub, { color: colors.muted }]}>
              VitaBot — Sistema de Agendamentos Médicos
            </Text>
          </View>
        </View>

        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Bem-vindo ao aplicativo <Text style={{ fontWeight: "700" }}>VitaBot</Text>. Ao utilizar nossos serviços de agendamento e atendimento virtual, você concorda expressamente com os seguintes termos e condições de uso.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>1. ACEITAÇÃO DOS TERMOS</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Ao realizar o cadastro ou utilizar o aplicativo para agendar consultas, você declara ter capacidade civil plena e concordar integralmente com estes Termos de Uso e com a nossa Política de Privacidade.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>2. SERVIÇOS DE AGENDAMENTO</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          O VitaBot possibilita o agendamento de consultas médicas e de saúde presenciais ou online com profissionais cadastrados. É de inteira responsabilidade do paciente fornecer informações corretas, tais como nome, CPF, telefone e e-mail válidos.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>3. NOTIFICAÇÕES E LEMBRETES</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Ao agendar uma consulta, o usuário autoriza o envio de mensagens de confirmação e lembretes via WhatsApp, SMS ou e-mail. Essas mensagens têm caráter estritamente informativo para evitar faltas e garantir a pontualidade dos atendimentos.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>4. CANCELAMENTOS E REMARCAÇÕES</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          Solicitamos que cancelamentos ou remarcações sejam feitos com antecedência mínima de 24 horas, permitindo que outros pacientes em fila de espera possam utilizar o horário.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>5. LIMITAÇÃO DE RESPONSABILIDADE</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          O VitaBot é um assistente virtual e plataforma de gestão de agendamentos. Em caso de emergências médicas ou sintomas graves, o usuário deve procurar imediatamente um pronto-socorro ou ligar para o SAMU (192). O assistente virtual não substitui diagnósticos e triagens de emergência.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.primary }]}>6. ALTERAÇÕES NOS TERMOS</Text>
        <Text style={[styles.paragraph, { color: colors.foreground }]}>
          A clínica se reserva o direito de alterar estes Termos de Uso periodicamente. Alterações significativas serão informadas através do aplicativo ou por e-mail cadastrado.
        </Text>

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
});
