import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getCurrentPatientId,
  getPatients,
  clearCurrentPatient,
  formatDate,
  type Patient,
} from "@/lib/store";
import { showAlert } from "@/lib/utils";

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
  danger,
  colors,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.error + "20" : colors.primary + "20" }]}>
        <IconSymbol name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.menuSub, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const [patient, setPatient] = useState<Patient | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const id = await getCurrentPatientId();
        if (id) {
          const patients = await getPatients();
          const found = patients.find((p) => p && p.id === id);
          setPatient(found ?? null);
        } else {
          setPatient(null);
        }
      })();
    }, [])
  );

  const handleLogout = () => {
    showAlert("Sair do perfil", "Deseja sair do seu perfil de paciente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await clearCurrentPatient();
          setPatient(null);
        },
      },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {patient ? (
          <>
            {/* Patient Card */}
            <View style={[styles.patientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {patient.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.fullName}</Text>
                <Text style={[styles.patientInfo, { color: colors.muted }]}>
                  Nascimento: {formatDate(patient.birthDate)}
                </Text>
                <Text style={[styles.patientInfo, { color: colors.muted }]}>
                  CPF: {patient.cpf}
                </Text>
              </View>
            </View>

            {/* Info Section */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>INFORMAÇÕES DE CONTATO</Text>
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.infoItem}>
                <IconSymbol name="phone.fill" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Telefone</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{patient.phone}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoItem}>
                <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>E-mail</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>{patient.email}</Text>
                </View>
              </View>
              {patient.healthInsurance && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.infoItem}>
                    <IconSymbol name="creditcard.fill" size={16} color={colors.primary} />
                    <View>
                      <Text style={[styles.infoLabel, { color: colors.muted }]}>Convênio</Text>
                      <Text style={[styles.infoValue, { color: colors.foreground }]}>{patient.healthInsurance}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Actions */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>AÇÕES</Text>
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="calendar"
                label="Minhas Consultas"
                subtitle="Ver histórico de agendamentos"
                onPress={() => router.push("/(tabs)/appointments" as any)}
                colors={colors}
              />
              <MenuItem
                icon="calendar.badge.plus"
                label="Agendar Consulta"
                subtitle="Marcar nova consulta"
                onPress={() => router.push("/booking" as any)}
                colors={colors}
              />
              <MenuItem
                icon="star.fill"
                label="Planos VitaBot"
                subtitle="Ver planos disponíveis"
                onPress={() => router.push("/plans" as any)}
                colors={colors}
              />
            </View>

            {/* Legal */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>PRIVACIDADE E TERMOS</Text>
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="lock.fill"
                label="Política de Privacidade (LGPD)"
                subtitle="Como protegemos seus dados"
                onPress={() => router.push("/privacy-policy" as any)}
                colors={colors}
              />
              <MenuItem
                icon="doc.text.fill"
                label="Termos de Uso"
                subtitle="Regras e condições do serviço"
                onPress={() => router.push("/terms" as any)}
                colors={colors}
              />
            </View>

            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="trash.fill"
                label="Sair do Perfil"
                onPress={handleLogout}
                danger
                colors={colors}
              />
            </View>
          </>
        ) : (
          <>
            {/* Guest State */}
            <View style={[styles.guestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.guestIcon, { backgroundColor: colors.primary + "20" }]}>
                <IconSymbol name="person.circle.fill" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.guestTitle, { color: colors.foreground }]}>Bem-vindo ao VitaBot</Text>
              <Text style={[styles.guestText, { color: colors.muted }]}>
                Cadastre-se para acessar seu histórico de consultas e receber lembretes personalizados.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.registerBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push("/patient-register" as any)}
              >
                <IconSymbol name="person.badge.plus" size={18} color="#0B1628" />
                <Text style={styles.registerBtnText}>Cadastrar-me</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.primary }]}>ACESSO RÁPIDO</Text>
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="calendar.badge.plus"
                label="Agendar Consulta"
                subtitle="Sem necessidade de cadastro"
                onPress={() => router.push("/booking" as any)}
                colors={colors}
              />
              <MenuItem
                icon="building.2.fill"
                label="Informações da Clínica"
                subtitle="Endereço, horários e médicos"
                onPress={() => router.push("/(tabs)/info" as any)}
                colors={colors}
              />
              <MenuItem
                icon="star.fill"
                label="Planos VitaBot"
                subtitle="Conheça os planos disponíveis"
                onPress={() => router.push("/plans" as any)}
                colors={colors}
              />
            </View>

            {/* Legal */}
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>PRIVACIDADE E TERMOS</Text>
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="lock.fill"
                label="Política de Privacidade (LGPD)"
                subtitle="Como tratamos seus dados"
                onPress={() => router.push("/privacy-policy" as any)}
                colors={colors}
              />
              <MenuItem
                icon="doc.text.fill"
                label="Termos de Uso"
                subtitle="Condições do sistema"
                onPress={() => router.push("/terms" as any)}
                colors={colors}
              />
            </View>

            {/* Admin Access */}
            <View style={[styles.menuSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MenuItem
                icon="gear"
                label="Acesso Administrativo"
                subtitle="Para gestores da clínica"
                onPress={() => router.push("/admin-login" as any)}
                colors={colors}
              />
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  content: { padding: 16 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#0B1628", fontSize: 20, fontWeight: "800" },
  patientName: { fontSize: 17, fontWeight: "700" },
  patientInfo: { fontSize: 13, marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  menuSection: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600" },
  menuSub: { fontSize: 12, marginTop: 1 },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14 },
  divider: { height: 1, marginLeft: 14 },
  guestCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: { fontSize: 20, fontWeight: "700" },
  guestText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  registerBtnText: { color: "#0B1628", fontWeight: "700", fontSize: 15 },
});
