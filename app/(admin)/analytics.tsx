import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getAppointments, type Appointment } from "@/lib/store";

function BarChart({
  data,
  maxValue,
  colors,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue: number;
  colors: any;
}) {
  return (
    <View style={styles.chart}>
      {data.map((item, i) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <View key={i} style={styles.barItem}>
            <Text style={[styles.barValue, { color: colors.foreground }]}>
              {item.value > 0 ? item.value : ""}
            </Text>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  { height: `${height}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.muted }]}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function StatRow({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen() {
  const colors = useColors();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const appts = await getAppointments();
    setAppointments(appts);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Compute analytics
  const total = appointments.length;
  const scheduled = appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // By specialty
  const bySpecialty: Record<string, number> = {};
  appointments.forEach((a) => {
    bySpecialty[a.specialty] = (bySpecialty[a.specialty] ?? 0) + 1;
  });
  const specialtyData = Object.entries(bySpecialty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label: label.split(" ")[0], value }));

  // By hour
  const byHour: Record<string, number> = {};
  appointments.forEach((a) => {
    const hour = a.time.split(":")[0] + "h";
    byHour[hour] = (byHour[hour] ?? 0) + 1;
  });
  const hourData = Object.entries(byHour)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }));

  // By day of week
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const byDay: number[] = [0, 0, 0, 0, 0, 0, 0];
  appointments.forEach((a) => {
    const d = new Date(a.date + "T12:00:00");
    byDay[d.getDay()]++;
  });
  const dayData = dayNames.map((label, i) => ({ label, value: byDay[i] }));

  const maxHour = Math.max(...hourData.map((d) => d.value), 1);
  const maxDay = Math.max(...dayData.map((d) => d.value), 1);
  const maxSpec = Math.max(...specialtyData.map((d) => d.value), 1);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        {/* Summary */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>RESUMO GERAL</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatRow label="Total de consultas" value={String(total)} color={colors.foreground} colors={colors} />
          <StatRow label="Agendadas / confirmadas" value={String(scheduled)} color={colors.primary} colors={colors} />
          <StatRow label="Realizadas" value={String(completed)} color={colors.success} colors={colors} />
          <StatRow label="Canceladas" value={String(cancelled)} color={colors.error} colors={colors} />
          <StatRow label="Taxa de cancelamento" value={`${cancellationRate}%`} color={cancellationRate > 20 ? colors.error : colors.success} colors={colors} />
        </View>

        {/* By Hour */}
        {hourData.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>HORÁRIOS DE PICO</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BarChart data={hourData} maxValue={maxHour} colors={colors} />
            </View>
          </>
        )}

        {/* By Day */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>CONSULTAS POR DIA DA SEMANA</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <BarChart data={dayData} maxValue={maxDay} colors={colors} />
        </View>

        {/* By Specialty */}
        {specialtyData.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>TOP ESPECIALIDADES</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BarChart data={specialtyData} maxValue={maxSpec} colors={colors} />
            </View>
          </>
        )}

        {total === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="chart.bar.fill" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Nenhum dado disponível ainda. Aguarde os primeiros agendamentos.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10, marginTop: 4, marginLeft: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 16, fontWeight: "700" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 120, gap: 4 },
  barItem: { flex: 1, alignItems: "center", gap: 4 },
  barValue: { fontSize: 11, fontWeight: "600" },
  barBg: { flex: 1, width: "100%", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 10, textAlign: "center" },
  emptyCard: { alignItems: "center", padding: 32, borderRadius: 14, borderWidth: 1, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
