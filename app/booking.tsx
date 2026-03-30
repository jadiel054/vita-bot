import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getDoctors,
  getPatients,
  getAppointments,
  addAppointment,
  getCurrentPatientId,
  getAvailableSlots,
  generateId,
  formatDate,
  getClinic,
  type Doctor,
  type Patient,
  type Appointment,
  SPECIALTIES,
} from "@/lib/store";

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = ["Tipo", "Médico", "Data", "Confirmação"];

function Stepper({ current, colors }: { current: number; colors: any }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => (
        <View key={i} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: i <= current ? colors.primary : colors.surface,
                borderColor: i <= current ? colors.primary : colors.border,
              },
            ]}
          >
            {i < current ? (
              <IconSymbol name="checkmark" size={14} color="#0B1628" />
            ) : (
              <Text style={[styles.stepNum, { color: i === current ? "#0B1628" : colors.muted }]}>
                {i + 1}
              </Text>
            )}
          </View>
          <Text style={[styles.stepLabel, { color: i === current ? colors.primary : colors.muted }]}>
            {label}
          </Text>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, { backgroundColor: i < current ? colors.primary : colors.border }]} />
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Date Grid ────────────────────────────────────────────────────────────────

function generateDates(): Array<{ date: string; label: string; weekday: string }> {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const weekday = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][d.getDay()];
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const date = d.toISOString().split("T")[0];
    dates.push({ date, label, weekday });
  }
  return dates;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingScreen() {
  const colors = useColors();
  const [step, setStep] = useState(0);
  const [patientType, setPatientType] = useState<"new" | "returning">();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [foundPatient, setFoundPatient] = useState<Patient>();
  const [cpfInput, setCpfInput] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      const docs = await getDoctors();
      setDoctors(docs);
      const appts = await getAppointments();
      setAppointments(appts);
    })();
  }, []);

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    setLoading(true);

    try {
      const patientId = await getCurrentPatientId();
      const patients = await getPatients();
      // If patientId exists in storage, prioritize it, otherwise use foundPatient (returning patient)
      let patient = patientId ? patients.find((p) => p.id === patientId) : foundPatient;

      // Fallback: if patientId was set but not found in patients list, try to find by ID again
      if (!patient && patientId) {
        patient = patients.find(p => p.id === patientId);
      }

      const appointment: Appointment = {
        id: generateId(),
        patientId: patient?.id ?? "guest",
        patientName: patient?.fullName ?? "Paciente",
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: selectedDate,
        time: selectedTime,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };

      await addAppointment(appointment);

      // Send WhatsApp notification to clinic owner via HTTP
      const clinic = await getClinic();
      if (clinic.whatsapp) {
        try {
          const response = await fetch("/api/whatsapp/notify-appointment", {
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
          });
          if (!response.ok) {
            const error = await response.json();
            console.warn("[Booking] Failed to send WhatsApp notification:", error);
          } else {
            console.log("[Booking] WhatsApp notification sent to clinic");
          }
        } catch (whatsappError) {
          console.warn("[Booking] Failed to send WhatsApp notification:", whatsappError);
        }
      }

      // Send confirmation message to patient via HTTP
      if (patient?.phone) {
        try {
          const response = await fetch("/api/whatsapp/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientName: appointment.patientName,
              specialty: appointment.specialty,
              date: appointment.date,
              time: appointment.time,
              doctorName: appointment.doctorName,
              recipientPhone: patient.phone,
              appointmentId: appointment.id,
            }),
          });
          if (!response.ok) {
            const error = await response.json();
            console.warn("[Booking] Failed to send patient confirmation:", error);
          } else {
            console.log("[Booking] Confirmation sent to patient");
          }
        } catch (whatsappError) {
          console.warn("[Booking] Failed to send patient confirmation:", whatsappError);
        }
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Consulta Agendada!",
        `Sua consulta com ${selectedDoctor.name} foi agendada para ${formatDate(selectedDate)} às ${selectedTime}.`,
        [{ text: "OK", onPress: () => router.push("/(tabs)/appointments" as any) }]
      );
    } catch (error) {
      Alert.alert("Erro", "Falha ao agendar consulta. Tente novamente.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindPatient = async () => {
    if (!cpfInput.trim()) return;
    const patients = await getPatients();
    const normalizedInput = cpfInput.replace(/\D/g, "");
    const patient = patients.find((p) => p.cpf.replace(/\D/g, "") === normalizedInput);
    if (patient) {
      setFoundPatient(patient);
      setStep(1);
    } else {
      Alert.alert("Paciente não encontrado", "Por favor, realize o cadastro primeiro.");
    }
  };

  // ─── Step 0: Patient Type ─────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center gap-6">
            <View className="items-center gap-2 mb-4">
              <Text style={{ fontSize: 24, fontWeight: "600", color: colors.foreground }}>
                Novo ou Retorno?
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
                Qual é o seu tipo de consulta?
              </Text>
            </View>

            <Pressable
              onPress={async () => {
                setPatientType("new");
                const existingId = await getCurrentPatientId();
                if (existingId) {
                  // Paciente já cadastrado, vai direto para seleção de médico
                  setStep(1);
                } else {
                  // Redireciona para cadastro antes de agendar
                  router.push("/patient-register" as any);
                }
              }}
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconSymbol name="person.badge.plus" size={32} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 8 }}>
                Paciente Novo
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                Primeira consulta
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPatientType("returning")}
              style={({ pressed }) => [
                styles.optionCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <IconSymbol name="person.fill" size={32} color={colors.primary} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 8 }}>
                Paciente Retorno
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                Já sou cadastrado
              </Text>
            </Pressable>

            {patientType === "returning" && (
              <View className="gap-3">
                <TextInput
                  placeholder="Digite seu CPF"
                  value={cpfInput}
                  onChangeText={setCpfInput}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
                  ]}
                  placeholderTextColor={colors.muted}
                />
                <Pressable
                  onPress={handleFindPatient}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={{ color: "#0B1628", fontWeight: "600" }}>Buscar Paciente</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Step 1: Doctor Selection ─────────────────────────────────────────────────

  if (step === 1) {
    return (
      <ScreenContainer className="p-4">
        <Stepper current={step} colors={colors} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            Escolha o Médico
          </Text>
          <FlatList
            key="doctors-list"
            scrollEnabled={false}
            data={doctors}
            keyExtractor={(d) => d.id}
            renderItem={({ item: doctor }) => (
              <Pressable
                onPress={() => {
                  setSelectedDoctor(doctor);
                  setStep(2);
                }}
                style={({ pressed }) => [
                  styles.doctorCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    Dr(a). {doctor.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {doctor.specialty}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.primary} />
              </Pressable>
            )}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Step 2: Date Selection ───────────────────────────────────────────────────

  if (step === 2) {
    const dates = generateDates();
    return (
      <ScreenContainer className="p-4">
        <Stepper current={step} colors={colors} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
            Escolha a Data
          </Text>
          <FlatList
            key="dates-list"
            scrollEnabled={false}
            data={dates}
            keyExtractor={(d) => d.date}
            numColumns={3}
            columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 8 }}
            renderItem={({ item: d }) => (
              <Pressable
                onPress={() => {
                  setSelectedDate(d.date);
                  setStep(3);
                }}
                style={({ pressed }) => [
                  styles.dateCard,
                  {
                    backgroundColor: selectedDate === d.date ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 10, color: colors.muted }}>{d.weekday}</Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: selectedDate === d.date ? "#0B1628" : colors.foreground,
                  }}
                >
                  {d.label}
                </Text>
              </Pressable>
            )}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Step 3: Time Selection & Confirmation ────────────────────────────────────

  const availableSlots = getAvailableSlots(selectedDoctor ?? ({} as Doctor), selectedDate ?? "", appointments);

  return (
    <ScreenContainer className="p-4">
      <Stepper current={step} colors={colors} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
          Escolha o Horário
        </Text>
        <FlatList
          key="times-list"
          scrollEnabled={false}
          data={availableSlots}
          keyExtractor={(t) => t}
          numColumns={3}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 8 }}
          renderItem={({ item: time }) => (
            <Pressable
              onPress={() => setSelectedTime(time)}
              style={({ pressed }) => [
                styles.timeCard,
                {
                  backgroundColor: selectedTime === time ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: selectedTime === time ? "#0B1628" : colors.foreground,
                }}
              >
                {time}
              </Text>
            </Pressable>
          )}
        />

        {selectedTime && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                Resumo da Consulta
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Médico: Dr(a). {selectedDoctor?.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Especialidade: {selectedDoctor?.specialty}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                Data: {formatDate(selectedDate ?? "")}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Horário: {selectedTime}</Text>
            </View>

            <Pressable
              onPress={handleConfirmBooking}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.8 : 1,
                },
              ]}
            >
              {loading ? (
                <Text style={{ color: "#0B1628", fontWeight: "600" }}>Confirmando...</Text>
              ) : (
                <Text style={{ color: "#0B1628", fontWeight: "600" }}>Confirmar Agendamento</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "600",
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  stepLine: {
    position: "absolute",
    height: 2,
    width: "80%",
    top: 16,
    left: "10%",
    zIndex: -1,
  },
  optionCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  doctorCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: "center",
  },
  dateCard: {
    width: "30%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  timeCard: {
    width: "30%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
});
