import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getAppointments, formatDate, type Appointment } from "@/lib/store";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Realizada",
  waitlist: "Lista de Espera",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#00C8D4",
  confirmed: "#22C55E",
  cancelled: "#EF4444",
  completed: "#7FA8C0",
  waitlist: "#F59E0B",
};

export default function AdminScheduleScreen() {
  const colors = useColors();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("today");

  const load = useCallback(async () => {
    const appts = await getAppointments();
    setAppointments(appts.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const today = new Date().toISOString().split("T")[0];

  const filtered = appointments.filter((a) => {
    if (filter === "today") return a.date === today;
    if (filter === "upcoming") return a.date >= today && a.status !== "cancelled";
    return true;
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Agenda Completa</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["today", "upcoming", "all"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, { borderBottomColor: filter === f ? colors.primary : "transparent" }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.primary : colors.muted }]}>
              {f === "today" ? "Hoje" : f === "upcoming" ? "Próximas" : "Todas"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="calendar" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>Nenhuma consulta encontrada.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] ?? colors.muted;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardLeft}>
                <Text style={[styles.time, { color: colors.primary }]}>{item.time}</Text>
                <Text style={[styles.date, { color: colors.muted }]}>{formatDate(item.date)}</Text>
              </View>
              <View style={[styles.dividerV, { backgroundColor: colors.border }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.patient, { color: colors.foreground }]}>{item.patientName}</Text>
                <Text style={[styles.doctor, { color: colors.muted }]}>{item.doctorName}</Text>
                <Text style={[styles.spec, { color: colors.primary }]}>{item.specialty}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[item.status]}</Text>
              </View>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  filterRow: { flexDirection: "row", borderBottomWidth: 1 },
  filterTab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
  filterText: { fontSize: 13, fontWeight: "600" },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  cardLeft: { alignItems: "center", minWidth: 52 },
  time: { fontSize: 16, fontWeight: "700" },
  date: { fontSize: 11, marginTop: 2 },
  dividerV: { width: 1, height: "100%", alignSelf: "stretch" },
  patient: { fontSize: 14, fontWeight: "700" },
  doctor: { fontSize: 12, marginTop: 2 },
  spec: { fontSize: 12, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
