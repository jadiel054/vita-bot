import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import {
  formatCpf,
  formatPhone,
  formatDate,
  generateId,
  getAvailableSlots,
  type Doctor,
  type Appointment,
} from "../lib/store";

describe("formatCpf", () => {
  it("formats 11 digits correctly", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
  });

  it("handles partial input", () => {
    expect(formatCpf("123")).toBe("123");
    expect(formatCpf("12345")).toBe("123.45");
  });

  it("strips non-numeric characters", () => {
    expect(formatCpf("123.456.789-01")).toBe("123.456.789-01");
  });
});

describe("formatPhone", () => {
  it("formats 11-digit mobile number", () => {
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("formats 10-digit landline", () => {
    expect(formatPhone("1130001234")).toBe("(11) 3000-1234");
  });

  it("strips non-numeric characters before formatting", () => {
    expect(formatPhone("(11) 99999-8888")).toBe("(11) 99999-8888");
  });
});

describe("formatDate", () => {
  it("converts ISO date to BR format", () => {
    expect(formatDate("2025-01-15")).toBe("15/01/2025");
  });

  it("returns empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("generateId", () => {
  it("generates a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("getAvailableSlots", () => {
  const doctor: Doctor = {
    id: "doc1",
    name: "Dra. Ana",
    specialty: "Clínica Geral",
    crm: "CRM/SP 123",
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    availableHours: ["08:00", "08:30", "09:00", "09:30", "10:00"],
  };

  it("returns all slots when no appointments exist", () => {
    // 2026-03-16 is a Monday
    const slots = getAvailableSlots(doctor, "2026-03-16", []);
    expect(slots).toEqual(["08:00", "08:30", "09:00", "09:30", "10:00"]);
  });

  it("excludes booked slots", () => {
    const appointments: Appointment[] = [
      {
        id: "appt1",
        patientId: "p1",
        patientName: "João",
        doctorId: "doc1",
        doctorName: "Dra. Ana",
        specialty: "Clínica Geral",
        date: "2026-03-16",
        time: "08:00",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
    ];
    const slots = getAvailableSlots(doctor, "2026-03-16", appointments);
    expect(slots).not.toContain("08:00");
    expect(slots).toContain("08:30");
  });

  it("includes cancelled appointment slots as available", () => {
    const appointments: Appointment[] = [
      {
        id: "appt2",
        patientId: "p1",
        patientName: "João",
        doctorId: "doc1",
        doctorName: "Dra. Ana",
        specialty: "Clínica Geral",
        date: "2026-03-16",
        time: "09:00",
        status: "cancelled",
        createdAt: new Date().toISOString(),
      },
    ];
    const slots = getAvailableSlots(doctor, "2026-03-16", appointments);
    expect(slots).toContain("09:00");
  });

  it("returns empty array for unavailable day", () => {
    // 2026-03-15 is a Sunday
    const slots = getAvailableSlots(doctor, "2026-03-15", []);
    expect(slots).toEqual([]);
  });
});
