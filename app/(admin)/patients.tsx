import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getPatients, formatDate, type Patient } from "@/lib/store";

export default function AdminPatientsScreen() {
  const colors = useColors();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await getPatients();
    setPatients(p.sort((a, b) => a.fullName.localeCompare(b.fullName)));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf.includes(search) ||
      p.cpf.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
      p.phone.includes(search)
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pacientes ({patients.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Buscar por nome, CPF ou telefone..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <IconSymbol name="person.2.fill" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {search ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {item.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.fullName}</Text>
              <Text style={[styles.info, { color: colors.muted }]}>CPF: {item.cpf}</Text>
              <Text style={[styles.info, { color: colors.muted }]}>
                Nasc.: {formatDate(item.birthDate)} • {item.phone}
              </Text>
              {item.healthInsurance && (
                <Text style={[styles.insurance, { color: colors.primary }]}>{item.healthInsurance}</Text>
              )}
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
  searchRow: { padding: 12, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" },
  name: { fontSize: 15, fontWeight: "700" },
  info: { fontSize: 12, marginTop: 2 },
  insurance: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
