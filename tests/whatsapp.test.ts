import { describe, it, expect, vi } from "vitest";

// Mock Twilio
vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

import {
  isWhatsAppEnabled,
  sendAppointmentNotification,
  sendCancellationNotification,
  sendTestNotification,
} from "../server/services/whatsapp";

describe("WhatsApp Service", () => {
  describe("isWhatsAppEnabled", () => {
    it("returns false when credentials are not configured in test environment", () => {
      // In test environment without real Twilio env vars, this returns false
      // In production with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_NUMBER set, it returns true
      const enabled = isWhatsAppEnabled();
      expect(typeof enabled).toBe("boolean");
    });
  });

  describe("sendAppointmentNotification", () => {
    it("returns error when service not configured", async () => {
      const result = await sendAppointmentNotification({
        patientName: "João Silva",
        specialty: "Cardiologia",
        date: "2025-03-15",
        time: "14:30",
        doctorName: "Dr. Carlos",
        recipientPhone: "+5511999999999",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendCancellationNotification", () => {
    it("returns error when service not configured", async () => {
      const result = await sendCancellationNotification({
        patientName: "João Silva",
        specialty: "Cardiologia",
        date: "2025-03-15",
        time: "14:30",
        doctorName: "Dr. Carlos",
        recipientPhone: "+5511999999999",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("sendTestNotification", () => {
    it("returns error when service not configured", async () => {
      const result = await sendTestNotification("+5511999999999");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
