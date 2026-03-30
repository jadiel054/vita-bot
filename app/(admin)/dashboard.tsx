import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getAppointments,
  getPatients,
  getDoctors,
  setAdminLoggedIn,
  getAdminSession,
  formatDate,
  type Appointment,
  type AdminSession,
} from "@/lib/store";

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
  colors,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  colors: any;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + "20" }]}>
        <IconSymbol name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.muted }]}>{label}</Text>
      {subtitle && <Text style={[styles.metricSub, { color }]}>{subtitle}</Text>}
    </View>
  );
}

function NavItem({
  icon,
  label,
  subtitle,
  onPress,
  colors,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.navItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
      onPress={onPress}
    >
      <View style={[styles.navIcon, { backgroundColor: colors.primary + "20" }]}>
        <IconSymbol name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.navLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.navSub, { color: colors.muted }]}>{subtitle}</Text>}
      </View>
      <IconSymbol name="chevron.right" size={16} color={colors.muted} />
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const colors = useColors();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  const load = useCallback(async () => {
    const [appts, patients, doctors, session] = await Promise.all([
      getAppointments(),
      getPatients(),
      getDoctors(),
      getAdminSession(),
    ]);
    setAppointments(appts);
    setPatientCount(patients.length);
    setDoctorCount(doctors.length);
    setAdminSession(session);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(
    (a) => a.date === today && a.status !== "cancelled"
  );
  const scheduledTotal = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed"
  ).length;
  const cancelledTotal = appointments.filter((a) => a.status === "cancelled").length;
  const cancellationRate =
    appointments.length > 0
      ? Math.round((cancelledTotal / appointments.length) * 100)
      : 0;

  const handleLogout = () => {
    Alert.alert("Sair do painel", "Deseja sair do painel administrativo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await setAdminLoggedIn(false);
          router.replace("/(tabs)" as any);
        },
      },
    ]);
  };

  const adminName = adminSession?.name ?? "Administrador";
  const adminRole = adminSession?.role ?? "admin";
  const isPermanent = adminSession?.permanent ?? false;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.adminNameRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {adminName}
            </Text>
            {isPermanent && (
              <View style={[styles.permanentBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                <IconSymbol name="shield.fill" size={10} color={colors.primary} />
                <Text style={[styles.permanentBadgeText, { color: colors.primary }]}>
                  {adminRole === "superadmin" ? "SUPERADMIN" : "ADMIN"}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={handleLogout}
        >
          <IconSymbol name="arrow.left" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="calendar"
            label="Consultas Hoje"
            value={todayAppts.length}
            subtitle={todayAppts.length > 0 ? "agendadas" : "nenhuma"}
            color={colors.primary}
            colors={colors}
          />
          <MetricCard
            icon="checkmark.circle.fill"
            label="Agendadas"
            value={scheduledTotal}
            subtitle="total ativo"
            color={colors.success}
            colors={colors}
          />
          <MetricCard
            icon="person.2.fill"
            label="Pacientes"
            value={patientCount}
            subtitle="cadastrados"
            color={colors.warning}
            colors={colors}
          />
          <MetricCard
            icon="xmark.circle.fill"
            label="Cancelamentos"
            value={`${cancellationRate}%`}
            subtitle="taxa total"
            color={colors.error}
            colors={colors}
          />
        </View>

        {/* Today's Appointments */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>AGENDA DE HOJE</Text>
        {todayAppts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="calendar" size={32} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Nenhuma consulta agendada para hoje.
            </Text>
          </View>
        ) : (
          todayAppts.slice(0, 5).map((appt) => (
            <View
              key={appt.id}
              style={[styles.apptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.timeTag, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.timeText, { color: colors.primary }]}>{appt.time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.apptPatient, { color: colors.foreground }]}>{appt.patientName}</Text>
                <Text style={[styles.apptDoctor, { color: colors.muted }]}>
                  {appt.doctorName} • {appt.specialty}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: "#22C55E" }]} />
            </View>
          ))
        )}

        {todayAppts.length > 5 && (
          <Pressable
            style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/(admin)/schedule" as any)}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Ver todas as {todayAppts.length} consultas
            </Text>
          </Pressable>
        )}

        {/* Navigation */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>GESTÃO</Text>
        <NavItem
          icon="calendar"
          label="Agenda Completa"
          subtitle="Visualizar e gerenciar consultas"
          onPress={() => router.push("/(admin)/schedule" as any)}
          colors={colors}
        />
        <NavItem
          icon="person.2.fill"
          label="Base de Pacientes"
          subtitle="Cadastros e histórico"
          onPress={() => router.push("/(admin)/patients" as any)}
          colors={colors}
        />
        <NavItem
          icon="stethoscope"
          label="Médicos e Especialidades"
          subtitle="Equipe médica e horários"
          onPress={() => router.push("/(admin)/doctors" as any)}
          colors={colors}
        />
        <NavItem
          icon="chart.bar.fill"
          label="Analytics e Relatórios"
          subtitle="Métricas e desempenho"
          onPress={() => router.push("/(admin)/analytics" as any)}
          colors={colors}
        />
        <NavItem
          icon="gear"
          label="Configurações da Clínica"
          subtitle="Nome, endereço e horários"
          onPress={() => router.push("/(admin)/settings" as any)}
          colors={colors}
        />
        <NavItem
          icon="brain"
          label="Configurações de IA"
          subtitle="Provedor e chaves de API"
          onPress={() => router.push("/(admin)/ai-settings" as any)}
          colors={colors}
        />

        {/* Monitoring Section — Superadmin only */}
        {adminRole === "superadmin" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>MONITORAMENTO</Text>
            <View style={[styles.monitorCard, { backgroundColor: colors.surface, borderColor: colors.primary + "40" }]}>
              <View style={styles.monitorHeader}>
                <IconSymbol name="shield.fill" size={18} color={colors.primary} />
                <Text style={[styles.monitorTitle, { color: colors.foreground }]}>Acesso SuperAdmin</Text>
                <View style={[styles.activeBadge, { backgroundColor: "#22C55E20" }]}>
                  <View style={[styles.activeDot, { backgroundColor: "#22C55E" }]} />
                  <Text style={[styles.activeText, { color: "#22C55E" }]}>Ativo</Text>
                </View>
              </View>
              <Text style={[styles.monitorDesc, { color: colors.muted }]}>
                Você tem acesso total e permanente ao sistema. Todas as ações são registradas automaticamente.
              </Text>
              <View style={styles.monitorStats}>
                <View style={styles.monitorStat}>
                  <Text style={[styles.monitorStatValue, { color: colors.foreground }]}>{appointments.length}</Text>
                  <Text style={[styles.monitorStatLabel, { color: colors.muted }]}>Total consultas</Text>
                </View>
                <View style={[styles.monitorDivider, { backgroundColor: colors.border }]} />
                <View style={styles.monitorStat}>
                  <Text style={[styles.monitorStatValue, { color: colors.foreground }]}>{patientCount}</Text>
                  <Text style={[styles.monitorStatLabel, { color: colors.muted }]}>Pacientes</Text>
                </View>
                <View style={[styles.monitorDivider, { backgroundColor: colors.border }]} />
                <View style={styles.monitorStat}>
                  <Text style={[styles.monitorStatValue, { color: colors.foreground }]}>{doctorCount}</Text>
                  <Text style={[styles.monitorStatLabel, { color: colors.muted }]}>Médicos</Text>
                </View>
              </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  adminNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  permanentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  permanentBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  logoutBtn: { padding: 8 },
  content: { padding: 16 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricValue: { fontSize: 26, fontWeight: "800" },
  metricLabel: { fontSize: 12 },
  metricSub: { fontSize: 11, fontWeight: "600" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  emptyCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  emptyText: { fontSize: 14 },
  apptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 52,
    alignItems: "center",
  },
  timeText: { fontSize: 14, fontWeight: "700" },
  apptPatient: { fontSize: 14, fontWeight: "600" },
  apptDoctor: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  seeAllBtn: { alignItems: "center", paddingVertical: 10, marginBottom: 16 },
  seeAllText: { fontSize: 14, fontWeight: "600" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  navSub: { fontSize: 12, marginTop: 2 },
  // Monitoring card
  monitorCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  monitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monitorTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 11, fontWeight: "700" },
  monitorDesc: { fontSize: 13, lineHeight: 18 },
  monitorStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  monitorStat: { flex: 1, alignItems: "center", gap: 2 },
  monitorStatValue: { fontSize: 22, fontWeight: "800" },
  monitorStatLabel: { fontSize: 11 },
  monitorDivider: { width: 1, height: 36 },
});
