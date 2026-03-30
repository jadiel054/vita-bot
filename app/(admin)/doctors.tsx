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
import { getDoctors, type Doctor } from "@/lib/store";

const DAY_LABELS: Record<string, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

export default function AdminDoctorsScreen() {
  const colors = useColors();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const d = await getDoctors();
    setDoctors(d);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Médicos ({doctors.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <IconSymbol name="stethoscope" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.spec, { color: colors.primary }]}>{item.specialty}</Text>
                <Text style={[styles.crm, { color: colors.muted }]}>{item.crm}</Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.daysRow}>
              <Text style={[styles.daysLabel, { color: colors.muted }]}>Dias de atendimento:</Text>
              <View style={styles.dayChips}>
                {item.availableDays.map((day) => (
                  <View key={day} style={[styles.dayChip, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.dayChipText, { color: colors.primary }]}>{DAY_LABELS[day]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.hoursRow}>
              <Text style={[styles.daysLabel, { color: colors.muted }]}>
                {item.availableHours.length} horários disponíveis
              </Text>
              <Text style={[styles.hoursRange, { color: colors.foreground }]}>
                {item.availableHours[0]} – {item.availableHours[item.availableHours.length - 1]}
              </Text>
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: { padding: 4 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700" },
  spec: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  crm: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  daysRow: { gap: 6 },
  daysLabel: { fontSize: 12 },
  dayChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayChipText: { fontSize: 12, fontWeight: "600" },
  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hoursRange: { fontSize: 13, fontWeight: "600" },
});
