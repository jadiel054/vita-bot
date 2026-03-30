import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanType = "free" | "pro" | "premium";

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

export interface AppState {
  clinic: ClinicSettings;
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  currentPatientId?: string;
  adminLoggedIn: boolean;
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
};

// ─── Store Functions ───────────────────────────────────────────────────────────

export async function getClinic(): Promise<ClinicSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.clinic);
    return raw ? JSON.parse(raw) : DEFAULT_CLINIC;
  } catch {
    return DEFAULT_CLINIC;
  }
}

export async function saveClinic(clinic: ClinicSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.clinic, JSON.stringify(clinic));
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.doctors);
    return raw ? JSON.parse(raw) : DEFAULT_DOCTORS;
  } catch {
    return DEFAULT_DOCTORS;
  }
}

export async function saveDoctors(doctors: Doctor[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.doctors, JSON.stringify(doctors));
}

export async function getPatients(): Promise<Patient[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.patients);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePatients(patients: Patient[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.patients, JSON.stringify(patients));
}

export async function getPatientByCpf(cpf: string): Promise<Patient | null> {
  const patients = await getPatients();
  return patients.find((p) => p.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, "")) ?? null;
}

export async function addPatient(patient: Patient): Promise<void> {
  const patients = await getPatients();
  patients.push(patient);
  await savePatients(patients);
}

export async function getAppointments(): Promise<Appointment[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.appointments);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAppointments(appointments: Appointment[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.appointments, JSON.stringify(appointments));
}

export async function addAppointment(appointment: Appointment): Promise<void> {
  const appointments = await getAppointments();
  appointments.push(appointment);
  await saveAppointments(appointments);
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Promise<void> {
  const appointments = await getAppointments();
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx !== -1) {
    appointments[idx].status = status;
    await saveAppointments(appointments);
  }
}

export async function getCurrentPatientId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.currentPatientId);
}

export async function setCurrentPatientId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.currentPatientId, id);
}

export async function clearCurrentPatient(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.currentPatientId);
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.adminLoggedIn);
  return val === "true";
}

export async function setAdminLoggedIn(val: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.adminLoggedIn, val ? "true" : "false");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function getWeekDayName(date: Date): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
}

export function getAvailableSlots(doctor: Doctor, date: string, appointments: Appointment[]): string[] {
  // Use date + "T12:00:00" to avoid timezone shifts during day-of-week calculation
  const d = new Date(date + "T12:00:00");
  const dayName = getWeekDayName(d);
  
  if (!doctor.availableDays || !doctor.availableDays.includes(dayName)) {
    return [];
  }

  const booked = appointments
    .filter((a) => a.doctorId === doctor.id && a.date === date && a.status !== "cancelled")
    .map((a) => a.time);

  return doctor.availableHours.filter((h) => !booked.includes(h));
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
