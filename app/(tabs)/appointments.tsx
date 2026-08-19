import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getAppointments,
  updateAppointmentStatus,
  formatDate,
  getClinic,
  type Appointment,
} from "@/lib/store";
import { showAlert } from "@/lib/utils";

const STATUS_LABELS: Record<Appointment["status"], string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Realizada",
  waitlist: "Lista de Espera",
};

const STATUS_COLORS: Record<Appointment["status"], string> = {
  scheduled: "#00C8D4",
  confirmed: "#22C55E",
  cancelled: "#EF4444",
  completed: "#7FA8C0",
  waitlist: "#F59E0B",
};

type FilterType = "upcoming" | "past" | "cancelled";

function AppointmentCard({
  item,
  colors,
  onCancel,
  onReschedule,
}: {
  item: Appointment;
  colors: any;
  onCancel: (id: string) => void;
  onReschedule: (item: Appointment) => void;
}) {
  const isUpcoming = item.status === "scheduled" || item.status === "confirmed";
  const statusColor = STATUS_COLORS[item.status];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.muted }]}>
          {formatDate(item.date)} • {item.time}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={[styles.doctorIcon, { backgroundColor: colors.primary + "20" }]}>
          <IconSymbol name="stethoscope" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.doctorName, { color: colors.foreground }]}>{item.doctorName}</Text>
          <Text style={[styles.specialty, { color: colors.primary }]}>{item.specialty}</Text>
        </View>
      </View>

      {isUpcoming && (
        <View style={styles.cardActions}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.error + "15", borderColor: colors.error },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onCancel(item.id)}
          >
            <IconSymbol name="xmark" size={14} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary + "15", borderColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => onReschedule(item)}
          >
            <IconSymbol name="arrow.clockwise" size={14} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Remarcar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function AppointmentsScreen() {
  const colors = useColors();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const appts = await getAppointments();
    setAppointments(appts || []);
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

  const handleCancel = (id: string) => {
    showAlert(
      "Cancelar Consulta",
      "Tem certeza que deseja cancelar esta consulta?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const appointment = appointments.find((a) => a.id === id);
              await updateAppointmentStatus(id, "cancelled");

              if (appointment) {
                const clinic = await getClinic();
                if (clinic.whatsapp) {
                  fetch("/api/whatsapp/notify-cancellation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      patientName: appointment.patientName,
                      specialty: appointment.specialty,
                      date: appointment.date,
                      time: appointment.time,
                      doctorName: appointment.doctorName,
                      recipientPhone: clinic.whatsapp,
                    }),
                  }).catch((err) => console.warn("[Appointments] Cancellation email error:", err));
                }
              }

              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              load();
            } catch (err) {
              console.error("[Appointments] Error cancelling:", err);
              showAlert("Erro", "Não foi possível cancelar a consulta.");
            }
          },
        },
      ]
    );
  };

  const handleReschedule = (_item: Appointment) => {
    router.push("/booking" as any);
  };

  const today = new Date().toISOString().split("T")[0];

  const filtered = appointments.filter((a) => {
    if (!a) return false;
    if (filter === "upcoming") return (a.status === "scheduled" || a.status === "confirmed") && a.date >= today;
    if (filter === "past") return a.status === "completed" || (a.date < today && a.status !== "cancelled");
    if (filter === "cancelled") return a.status === "cancelled";
    return true;
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Minhas Consultas</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}
          onPress={() => router.push("/booking" as any)}
        >
          <IconSymbol name="plus" size={20} color="#0B1628" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["upcoming", "past", "cancelled"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            style={[
              styles.filterTab,
              { borderBottomColor: filter === f ? colors.primary : "transparent" },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === f ? colors.primary : colors.muted },
              ]}
            >
              {f === "upcoming" ? "Próximas" : f === "past" ? "Realizadas" : "Canceladas"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma consulta</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {filter === "upcoming" ? "Você não tem consultas agendadas." : "Nenhum registro encontrado."}
            </Text>
            {filter === "upcoming" && (
              <Pressable
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push("/booking" as any)}
              >
                <Text style={styles.emptyBtnText}>Agendar Consulta</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            colors={colors}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
          />
        )}
      />
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
  headerTitle: { fontSize: 20, fontWeight: "700" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  dateText: { fontSize: 12 },
  cardBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorName: { fontSize: 15, fontWeight: "700" },
  specialty: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#0B1628", fontWeight: "700", fontSize: 15 },
});
