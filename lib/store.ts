import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanType = "free" | "pro" | "premium";

export interface AdminSession {
  email: string;
  name: string;
  role: "superadmin" | "admin";
  permanent: boolean;
  loginAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
  email: string;
  healthInsurance: string;
  howFound: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  availableDays: string[]; // ["monday","tuesday",...]
  availableHours: string[]; // ["08:00","08:30",...]
  photoUrl?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO date "2025-01-15"
  time: string; // "14:30"
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "waitlist";
  notes?: string;
  createdAt: string;
}

export interface ClinicSettings {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  openingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  insurances: string[];
  paymentMethods: string[];
  parkingInfo: string;
  howToGetThere: string;
  plan: PlanType;
}

export interface AIConfig {
  provider: "manus" | "openai" | "anthropic" | "groq";
  openaiKey?: string;
  anthropicKey?: string;
  groqKey?: string;
  enabled: boolean;
  lastUpdated: string;
}

export interface ConsentRecord {
  accepted: boolean;
  acceptedAt: string;
  version: string;
}

export interface AppState {
  clinic: ClinicSettings;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  currentPatientId?: string;
  adminLoggedIn: boolean;
  aiConfig?: AIConfig;
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: "doc1",
    name: "Dra. Ana Beatriz Costa",
    specialty: "Clínica Geral",
    crm: "CRM/SP 123456",
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    availableHours: ["08:00","08:30","09:00","09:30","10:00","10:30","14:00","14:30","15:00","15:30","16:00","16:30"],
  },
  {
    id: "doc2",
    name: "Dr. Carlos Eduardo Lima",
    specialty: "Cardiologia",
    crm: "CRM/SP 234567",
    availableDays: ["monday", "wednesday", "friday"],
    availableHours: ["09:00","09:30","10:00","10:30","11:00","15:00","15:30","16:00"],
  },
  {
    id: "doc3",
    name: "Dra. Fernanda Oliveira",
    specialty: "Pediatria",
    crm: "CRM/SP 345678",
    availableDays: ["tuesday", "thursday", "saturday"],
    availableHours: ["08:00","08:30","09:00","09:30","10:00","10:30","11:00"],
  },
  {
    id: "doc4",
    name: "Dr. Ricardo Santos",
    specialty: "Ortopedia",
    crm: "CRM/SP 456789",
    availableDays: ["monday", "tuesday", "thursday", "friday"],
    availableHours: ["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"],
  },
];

const DEFAULT_CLINIC: ClinicSettings = {
  name: "Clínica VitaSaúde",
  address: "Av. Paulista, 1000 — Sala 502",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  zipCode: "01310-100",
  phone: "(11) 3000-0000",
  whatsapp: "+5549999940482",
  email: "contato@vitasaude.com.br",
  openingHours: {
    weekdays: "Segunda a Sexta: 07h às 19h",
    saturday: "Sábado: 08h às 13h",
    sunday: "Domingo: Fechado",
  },
  insurances: [
    "Unimed", "Bradesco Saúde", "SulAmérica", "Amil",
    "Porto Seguro", "Hapvida", "NotreDame Intermédica",
    "Particular (sem convênio)",
  ],
  paymentMethods: ["Dinheiro", "Cartão de Crédito", "Cartão de Débito", "PIX"],
  parkingInfo: "Estacionamento conveniado no edifício. Apresente o ticket na recepção para desconto.",
  howToGetThere: "Metrô Trianon-MASP (Linha 2-Verde), saída pela Av. Paulista. Ônibus: linhas 107P, 117P, 5100.",
  plan: "pro",
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  clinic: "@vitabot:clinic",
  doctors: "@vitabot:doctors",
  patients: "@vitabot:patients",
  appointments: "@vitabot:appointments",
  currentPatientId: "@vitabot:currentPatientId",
  adminLoggedIn: "@vitabot:adminLoggedIn",
  adminSession: "@vitabot:adminSession",
  aiConfig: "@vitabot:aiConfig",
  consent: "@vitabot:consent",
};

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: "manus",
  enabled: true,
  lastUpdated: new Date().toISOString(),
};

// ─── Store Functions ───────────────────────────────────────────────────────────

export async function getClinic(): Promise<ClinicSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.clinic);
    return raw ? JSON.parse(raw) : DEFAULT_CLINIC;
  } catch (e) {
    console.warn("AsyncStorage getClinic error:", e);
    return DEFAULT_CLINIC;
  }
}

export async function saveClinic(clinic: ClinicSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.clinic, JSON.stringify(clinic));
  } catch (e) {
    console.warn("AsyncStorage saveClinic error:", e);
  }
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.doctors);
    return raw ? JSON.parse(raw) : DEFAULT_DOCTORS;
  } catch (e) {
    console.warn("AsyncStorage getDoctors error:", e);
    return DEFAULT_DOCTORS;
  }
}

export async function saveDoctors(doctors: Doctor[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.doctors, JSON.stringify(doctors));
  } catch (e) {
    console.warn("AsyncStorage saveDoctors error:", e);
  }
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.patients);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("AsyncStorage getPatients error:", e);
    return [];
  }
}

export async function savePatients(patients: Patient[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.patients, JSON.stringify(patients));
  } catch (e) {
    console.warn("AsyncStorage savePatients error:", e);
  }
}

export async function getPatientByCpf(cpf: string): Promise<Patient | null> {
  try {
    const patients = await getPatients();
    const cleanCpf = cpf.replace(/\D/g, "");
    return patients.find((p) => p && p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf) ?? null;
  } catch {
    return null;
  }
}

export async function addPatient(patient: Patient): Promise<void> {
  try {
    const patients = await getPatients();
    patients.push(patient);
    await savePatients(patients);
  } catch (e) {
    console.warn("AsyncStorage addPatient error:", e);
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.appointments);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("AsyncStorage getAppointments error:", e);
    return [];
  }
}

export async function saveAppointments(appointments: Appointment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.appointments, JSON.stringify(appointments));
  } catch (e) {
    console.warn("AsyncStorage saveAppointments error:", e);
  }
}

export async function addAppointment(appointment: Appointment): Promise<void> {
  try {
    const appointments = await getAppointments();
    appointments.push(appointment);
    await saveAppointments(appointments);
  } catch (e) {
    console.warn("AsyncStorage addAppointment error:", e);
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<void> {
  try {
    const appointments = await getAppointments();
    const idx = appointments.findIndex((a) => a && a.id === id);
    if (idx !== -1) {
      appointments[idx].status = status;
      await saveAppointments(appointments);
    }
  } catch (e) {
    console.warn("AsyncStorage updateAppointmentStatus error:", e);
  }
}

export async function getCurrentPatientId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.currentPatientId);
  } catch {
    return null;
  }
}

export async function setCurrentPatientId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.currentPatientId, id);
  } catch (e) {
    console.warn("AsyncStorage setCurrentPatientId error:", e);
  }
}

export async function clearCurrentPatient(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.currentPatientId);
  } catch (e) {
    console.warn("AsyncStorage clearCurrentPatient error:", e);
  }
}

export async function isAdminLoggedIn(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.adminLoggedIn);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setAdminLoggedIn(val: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.adminLoggedIn, val ? "true" : "false");
    if (!val) {
      await AsyncStorage.removeItem(KEYS.adminSession);
    }
  } catch (e) {
    console.warn("AsyncStorage setAdminLoggedIn error:", e);
  }
}

export async function saveAdminSession(session: AdminSession): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.adminSession, JSON.stringify(session));
  } catch (e) {
    console.warn("AsyncStorage saveAdminSession error:", e);
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.adminSession);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEYS.adminSession);
    await AsyncStorage.setItem(KEYS.adminLoggedIn, "false");
  } catch (e) {
    console.warn("AsyncStorage clearAdminSession error:", e);
  }
}

// ─── Consent Functions ─────────────────────────────────────────────────────────

export async function saveUserConsent(accepted: boolean = true): Promise<void> {
  try {
    const record: ConsentRecord = {
      accepted,
      acceptedAt: new Date().toISOString(),
      version: "1.0.0",
    };
    await AsyncStorage.setItem(KEYS.consent, JSON.stringify(record));
  } catch (e) {
    console.warn("AsyncStorage saveUserConsent error:", e);
  }
}

export async function getUserConsent(): Promise<ConsentRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.consent);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCpf(cpf: string): string {
  if (!cpf) return "";
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function formatDate(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function getWeekDayName(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
}

export function getAvailableSlots(
  doctor?: Doctor | null,
  date?: string | null,
  appointments?: Appointment[] | null
): string[] {
  if (
    !doctor ||
    !doctor.id ||
    !doctor.availableDays ||
    !doctor.availableHours ||
    !Array.isArray(doctor.availableHours)
  ) {
    return [];
  }
  if (!date || typeof date !== "string") {
    return [];
  }

  try {
    const d = new Date(date + "T12:00:00");
    if (isNaN(d.getTime())) return [];
    const dayName = getWeekDayName(d);

    if (!doctor.availableDays.includes(dayName)) {
      return [];
    }

    const appts = Array.isArray(appointments) ? appointments : [];
    const booked = appts
      .filter((a) => a && a.doctorId === doctor.id && a.date === date && a.status !== "cancelled")
      .map((a) => a.time);

    return doctor.availableHours.filter((h) => typeof h === "string" && !booked.includes(h));
  } catch (err) {
    console.error("[getAvailableSlots] Error computing slots:", err);
    return [];
  }
}

// ─── AI Configuration ────────────────────────────────────────────────────────

export async function getAIConfig(): Promise<AIConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.aiConfig);
    return raw ? JSON.parse(raw) : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export async function saveAIConfig(config: AIConfig): Promise<void> {
  try {
    config.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.aiConfig, JSON.stringify(config));
  } catch (e) {
    console.warn("AsyncStorage saveAIConfig error:", e);
  }
}

export async function updateAIProvider(provider: AIConfig["provider"]): Promise<void> {
  const config = await getAIConfig();
  config.provider = provider;
  await saveAIConfig(config);
}

export async function setAIApiKey(
  provider: "openai" | "anthropic" | "groq",
  key: string
): Promise<void> {
  const config = await getAIConfig();
  if (provider === "openai") config.openaiKey = key;
  if (provider === "anthropic") config.anthropicKey = key;
  if (provider === "groq") config.groqKey = key;
  await saveAIConfig(config);
}

export async function toggleAIEnabled(enabled: boolean): Promise<void> {
  const config = await getAIConfig();
  config.enabled = enabled;
  await saveAIConfig(config);
}

export const SPECIALTIES = [
  "Clínica Geral",
  "Cardiologia",
  "Pediatria",
  "Ortopedia",
  "Ginecologia",
  "Dermatologia",
  "Neurologia",
  "Oftalmologia",
  "Otorrinolaringologia",
  "Psiquiatria",
  "Endocrinologia",
  "Urologia",
];
