import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getClinic, getDoctors, type ClinicSettings, type Doctor } from "@/lib/store";

function InfoRow({ icon, label, value, onPress, colors }: {
  icon: any;
  label: string;
  value: string;
  onPress?: () => void;
  colors: any;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.infoRow,
        { borderBottomColor: colors.border },
        pressed && onPress && { opacity: 0.7 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.infoIcon, { backgroundColor: colors.primary + "20" }]}>
        <IconSymbol name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
      {onPress && <IconSymbol name="chevron.right" size={16} color={colors.muted} />}
    </Pressable>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.primary }]}>{title}</Text>
  );
}

export default function InfoScreen() {
  const colors = useColors();
  const [clinic, setClinic] = useState<ClinicSettings | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    (async () => {
      const [c, d] = await Promise.all([getClinic(), getDoctors()]);
      setClinic(c);
      setDoctors(d || []);
    })();
  }, []);

  if (!clinic) return null;

  const handleCall = () => Linking.openURL(`tel:${clinic.phone.replace(/\D/g, "")}`);
  const handleWhatsApp = () =>
    Linking.openURL(`https://wa.me/55${clinic.whatsapp.replace(/\D/g, "")}`);
  const handleEmail = () => Linking.openURL(`mailto:${clinic.email}`);

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Informações da Clínica</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Clinic Name Banner */}
        <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.bannerIcon, { backgroundColor: colors.primary }]}>
            <IconSymbol name="cross.fill" size={28} color="#0B1628" />
          </View>
          <View>
            <Text style={[styles.clinicName, { color: colors.foreground }]}>{clinic.name}</Text>
            <Text style={[styles.clinicTagline, { color: colors.primary }]}>Sua saúde em boas mãos</Text>
          </View>
        </View>

        {/* Contato */}
        <SectionHeader title="CONTATO" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow
            icon="phone.fill"
            label="Telefone"
            value={clinic.phone}
            onPress={handleCall}
            colors={colors}
          />
          <InfoRow
            icon="bubble.left.fill"
            label="WhatsApp"
            value={clinic.whatsapp}
            onPress={handleWhatsApp}
            colors={colors}
          />
          <InfoRow
            icon="envelope.fill"
            label="E-mail"
            value={clinic.email}
            onPress={handleEmail}
            colors={colors}
          />
        </View>

        {/* Endereço */}
        <SectionHeader title="ENDEREÇO" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow
            icon="location.fill"
            label="Endereço"
            value={`${clinic.address}\n${clinic.neighborhood} — ${clinic.city}/${clinic.state}`}
            colors={colors}
          />
          <InfoRow
            icon="arrow.right"
            label="Como chegar"
            value={clinic.howToGetThere}
            colors={colors}
          />
          <InfoRow
            icon="car.fill"
            label="Estacionamento"
            value={clinic.parkingInfo}
            colors={colors}
          />
        </View>

        {/* Horários */}
        <SectionHeader title="HORÁRIOS DE FUNCIONAMENTO" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon="clock.fill" label="Dias úteis" value={clinic.openingHours.weekdays} colors={colors} />
          <InfoRow icon="clock" label="Sábado" value={clinic.openingHours.saturday} colors={colors} />
          <InfoRow icon="clock" label="Domingo" value={clinic.openingHours.sunday} colors={colors} />
        </View>

        {/* Médicos */}
        <SectionHeader title="NOSSA EQUIPE MÉDICA" colors={colors} />
        {doctors.map((doc) => (
          <View
            key={doc.id}
            style={[styles.doctorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.doctorAvatar, { backgroundColor: colors.primary + "20" }]}>
              <IconSymbol name="stethoscope" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.doctorName, { color: colors.foreground }]}>{doc.name}</Text>
              <Text style={[styles.doctorSpec, { color: colors.primary }]}>{doc.specialty}</Text>
              <Text style={[styles.doctorCrm, { color: colors.muted }]}>{doc.crm}</Text>
            </View>
          </View>
        ))}

        {/* Legal & Privacidade */}
        <SectionHeader title="LEGAL & PRIVACIDADE" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow
            icon="lock.fill"
            label="Política de Privacidade (LGPD)"
            value="Conheça como tratamos seus dados"
            onPress={() => router.push("/privacy-policy" as any)}
            colors={colors}
          />
          <InfoRow
            icon="doc.text.fill"
            label="Termos de Uso"
            value="Condições de uso do VitaBot"
            onPress={() => router.push("/terms" as any)}
            colors={colors}
          />
        </View>

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
  content: { padding: 16, gap: 4 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  clinicName: { fontSize: 17, fontWeight: "700" },
  clinicTagline: { fontSize: 13, marginTop: 2 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, lineHeight: 20 },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorName: { fontSize: 15, fontWeight: "700" },
  doctorSpec: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  doctorCrm: { fontSize: 12, marginTop: 2 },
});
