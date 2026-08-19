import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

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
} from "@/lib/store";
import { isValidCPF, getCPFErrorMessage } from "@/lib/cpf-validator";
import { showAlert, sanitizeCPF } from "@/lib/utils";
import { getApiBaseUrl } from "@/constants/oauth";

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

// ─── Date Grid Helper ──────────────────────────────────────────────────────────

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
  const [fetchingData, setFetchingData] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [foundPatient, setFoundPatient] = useState<Patient>();
  const [cpfInput, setCpfInput] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [docs, appts] = await Promise.all([getDoctors(), getAppointments()]);
        if (isMounted) {
          setDoctors(docs || []);
          setAppointments(appts || []);
        }
      } catch (err) {
        console.error("[BookingScreen] Error loading data:", err);
      } finally {
        if (isMounted) setFetchingData(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      showAlert("Atenção", "Por favor, selecione o médico, a data e o horário.");
      return;
    }
    setLoading(true);

    try {
      const patientId = await getCurrentPatientId();
      const patients = await getPatients();
      let patient = patientId ? patients.find((p) => p.id === patientId) : foundPatient;

      if (!patient && patientId) {
        patient = patients.find((p) => p.id === patientId);
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

      // WhatsApp notification to clinic owner
      try {
        const clinic = await getClinic();
        if (clinic.whatsapp) {
          const apiBaseUrl = getApiBaseUrl();
          fetch(`${apiBaseUrl}/api/whatsapp/notify-appointment`, {
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
          }).catch((err) => console.warn("[Booking] WhatsApp notification error:", err));
        }
      } catch (e) {
        console.warn("[Booking] Failed sending clinic notification:", e);
      }

      // Confirmation to patient
      if (patient?.phone) {
        try {
          const apiBaseUrl = getApiBaseUrl();
          fetch(`${apiBaseUrl}/api/whatsapp/send-confirmation`, {
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
          }).catch((err) => console.warn("[Booking] Patient confirmation error:", err));
        } catch (e) {
          console.warn("[Booking] Failed sending patient confirmation:", e);
        }
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      showAlert(
        "✅ Consulta Agendada!",
        `Sua consulta com ${selectedDoctor.name} foi agendada com sucesso para ${formatDate(selectedDate)} às ${selectedTime}.`,
        [
          {
            text: "OK",
            onPress: () => {
              if (router.canGoBack()) {
                router.dismissAll();
              }
              router.replace("/(tabs)/appointments" as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Booking] Error confirming booking:", error);
      showAlert("Erro", "Falha ao agendar consulta. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFindPatient = async () => {
    const sanitizedCpf = sanitizeCPF(cpfInput);
    if (!sanitizedCpf) {
      showAlert("CPF vazio", "Por favor, digite seu CPF.");
      return;
    }

    if (!isValidCPF(sanitizedCpf)) {
      const errorMsg = getCPFErrorMessage(sanitizedCpf);
      showAlert("CPF Inválido", errorMsg);
      return;
    }

    try {
      const patients = await getPatients();
      const patient = patients.find((p) => p && p.cpf && p.cpf.replace(/\D/g, "") === sanitizedCpf);

      if (patient) {
        setFoundPatient(patient);
        setStep(1);
      } else {
        showAlert(
          "Paciente não encontrado",
          "O CPF informado não está cadastrado. Por favor, realize o cadastro primeiro.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Cadastrar Agora",
              onPress: () => router.push("/patient-register" as any),
            },
          ]
        );
      }
    } catch (e) {
      console.error("[Booking] Error finding patient:", e);
      showAlert("Erro", "Não foi possível buscar os dados do paciente.");
    }
  };

  if (fetchingData) {
    return (
      <ScreenContainer className="p-4 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>Carregando dados da clínica...</Text>
      </ScreenContainer>
    );
  }

  // ─── Header bar for back navigation ──────────────────────────────────────────

  const renderHeader = () => (
    <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        onPress={() => {
          if (step > 0) {
            setStep((s) => s - 1);
          } else {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)" as any);
            }
          }
        }}
      >
        <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: "500", marginLeft: 4 }}>
          {step > 0 ? "Voltar" : "Fechar"}
        </Text>
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>Agendar Consulta</Text>
      <View style={{ width: 60 }} />
    </View>
  );

  // ─── Step 0: Patient Type ─────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <ScreenContainer className="p-4">
        {renderHeader()}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 12 }}>
          <View className="flex-1 justify-center gap-6">
            <View className="items-center gap-2 mb-2">
              <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
                Novo ou Retorno?
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
                Qual é o seu tipo de consulta?
              </Text>
            </View>

            <Pressable
              onPress={async () => {
                setPatientType("new");
                try {
                  const existingId = await getCurrentPatientId();
                  if (existingId) {
                    setStep(1);
                  } else {
                    router.push("/patient-register" as any);
                  }
                } catch {
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
                Primeira consulta na clínica
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
              <View className="gap-3 mt-2">
                <TextInput
                  placeholder="Digite seu CPF (ex: 000.000.000-00)"
                  value={cpfInput}
                  onChangeText={(v) => setCpfInput(sanitizeCPF(v))}
                  keyboardType="numeric"
                  maxLength={14}
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
                  <Text style={{ color: "#0B1628", fontWeight: "700" }}>Buscar Paciente</Text>
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
        {renderHeader()}
        <Stepper current={step} colors={colors} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Escolha o Médico
          </Text>
          {doctors.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 24 }}>
              Nenhum médico disponível no momento.
            </Text>
          ) : (
            <View style={styles.listContainer}>
              {doctors.map((doctor) => (
                <Pressable
                  key={doctor.id}
                  onPress={() => {
                    setSelectedDoctor(doctor);
                    setStep(2);
                  }}
                  style={({ pressed }) => [
                    styles.doctorCard,
                    {
                      backgroundColor: selectedDoctor?.id === doctor.id ? colors.primary + "15" : colors.surface,
                      borderColor: selectedDoctor?.id === doctor.id ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                      {doctor.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.primary, marginTop: 2, fontWeight: "500" }}>
                      {doctor.specialty}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                      {doctor.crm}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Step 2: Date Selection ───────────────────────────────────────────────────

  if (step === 2) {
    const dates = generateDates();
    return (
      <ScreenContainer className="p-4">
        {renderHeader()}
        <Stepper current={step} colors={colors} />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Escolha a Data
          </Text>
          <View style={styles.gridContainer}>
            {dates.map((d) => {
              const isSelected = selectedDate === d.date;
              return (
                <Pressable
                  key={d.date}
                  onPress={() => {
                    setSelectedDate(d.date);
                    setStep(3);
                  }}
                  style={({ pressed }) => [
                    styles.dateCardGrid,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10, color: isSelected ? "#0B1628" : colors.muted }}>
                    {d.weekday}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isSelected ? "#0B1628" : colors.foreground,
                      marginTop: 2,
                    }}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Step 3: Time Selection & Confirmation ────────────────────────────────────

  const availableSlots = getAvailableSlots(selectedDoctor, selectedDate, appointments);

  return (
    <ScreenContainer className="p-4">
      {renderHeader()}
      <Stepper current={step} colors={colors} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
          Escolha o Horário
        </Text>

        {availableSlots.length === 0 ? (
          <View style={[styles.emptySlotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="calendar.badge.exclamationmark" size={32} color={colors.muted} />
            <Text style={{ color: colors.foreground, fontWeight: "600", marginTop: 8 }}>
              Nenhum horário disponível para esta data.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 4 }}>
              Por favor, selecione outra data para a consulta.
            </Text>
            <Pressable
              onPress={() => setStep(2)}
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 12, paddingHorizontal: 20 }]}
            >
              <Text style={{ color: "#0B1628", fontWeight: "700" }}>Escolher outra data</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {availableSlots.map((time) => {
              const isSelected = selectedTime === time;
              return (
                <Pressable
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={({ pressed }) => [
                    styles.timeCardGrid,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isSelected ? "#0B1628" : colors.foreground,
                    }}
                  >
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {selectedTime && (
          <View style={{ marginTop: 24, gap: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                Resumo do Agendamento
              </Text>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
              <Text style={{ fontSize: 13, color: colors.foreground }}>
                <Text style={{ color: colors.muted }}>Médico(a):</Text> {selectedDoctor?.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.foreground }}>
                <Text style={{ color: colors.muted }}>Especialidade:</Text> {selectedDoctor?.specialty}
              </Text>
              <Text style={{ fontSize: 13, color: colors.foreground }}>
                <Text style={{ color: colors.muted }}>Data:</Text> {formatDate(selectedDate ?? "")}
              </Text>
              <Text style={{ fontSize: 13, color: colors.foreground }}>
                <Text style={{ color: colors.muted }}>Horário:</Text> {selectedTime}
              </Text>
            </View>

            <Pressable
              onPress={handleConfirmBooking}
              disabled={loading}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.8 : 1,
                  paddingVertical: 16,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#0B1628" />
              ) : (
                <Text style={{ color: "#0B1628", fontWeight: "700", fontSize: 16 }}>
                  Confirmar Agendamento
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  stepLine: {
    position: "absolute",
    height: 2,
    width: "80%",
    top: 15,
    left: "10%",
    zIndex: -1,
  },
  optionCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  listContainer: {
    gap: 10,
  },
  doctorCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dateCardGrid: {
    width: "31%",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  timeCardGrid: {
    width: "31%",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  emptySlotCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
