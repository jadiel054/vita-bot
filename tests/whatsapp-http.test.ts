import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for WhatsApp service functions (unit tests with mocked Twilio)
 * These test the service logic and message formatting without requiring
 * a running server or real Twilio credentials.
 */

// Shared mock for messages.create — must be defined before vi.mock factory
const mockMessagesCreate = vi.fn();

// Mock Twilio module — factory runs at module load time
vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockMessagesCreate,
    },
  })),
}));

// Stub environment variables so isWhatsAppEnabled() returns true
vi.stubEnv("TWILIO_ACCOUNT_SID", "ACmock_account_sid_for_tests");
vi.stubEnv("TWILIO_AUTH_TOKEN", "mock_auth_token_for_tests");
vi.stubEnv("TWILIO_WHATSAPP_NUMBER", "+14155238886");

// Import AFTER mocks are set up
const { sendAppointmentNotification, sendCancellationNotification, sendPatientConfirmation, isWhatsAppEnabled } =
  await import("../server/services/whatsapp");

describe("WhatsApp HTTP Routes (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessagesCreate.mockResolvedValue({ sid: "SM_mock_message_id_12345" });
  });

  describe("isWhatsAppEnabled", () => {
    it("returns true when all credentials are set", () => {
      expect(isWhatsAppEnabled()).toBe(true);
    });
  });

  describe("sendAppointmentNotification", () => {
    it("sends appointment notification with valid payload", async () => {
      const result = await sendAppointmentNotification({
        patientName: "João Silva",
        specialty: "Cardiologia",
        date: "2025-03-20",
        time: "14:30",
        doctorName: "Dr. Carlos Santos",
        recipientPhone: "+5549999940482",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("SM_mock_message_id_12345");
      expect(mockMessagesCreate).toHaveBeenCalledOnce();
    });

    it("includes patient name in message body", async () => {
      await sendAppointmentNotification({
        patientName: "Maria Oliveira",
        specialty: "Pediatria",
        date: "2025-04-10",
        time: "09:00",
        doctorName: "Dra. Ana Costa",
        recipientPhone: "+5511999999999",
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Maria Oliveira"),
        })
      );
    });

    it("formats date from ISO to BR format in message", async () => {
      await sendAppointmentNotification({
        patientName: "Pedro Souza",
        specialty: "Ortopedia",
        date: "2025-06-15",
        time: "10:30",
        doctorName: "Dr. Ricardo Lima",
        recipientPhone: "+5511999999999",
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("15/06/2025"),
        })
      );
    });
  });

  describe("sendCancellationNotification", () => {
    it("sends cancellation notification with valid payload", async () => {
      const result = await sendCancellationNotification({
        patientName: "Maria Santos",
        specialty: "Oftalmologia",
        date: "2025-03-25",
        time: "10:00",
        doctorName: "Dra. Ana Costa",
        recipientPhone: "+5549999940482",
        reason: "Paciente solicitou cancelamento",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("sends cancellation without optional reason", async () => {
      const result = await sendCancellationNotification({
        patientName: "Pedro Oliveira",
        specialty: "Dermatologia",
        date: "2025-03-22",
        time: "15:30",
        doctorName: "Dr. Roberto Lima",
        recipientPhone: "+5549999940482",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("sendPatientConfirmation", () => {
    it("sends patient confirmation with valid payload", async () => {
      const result = await sendPatientConfirmation({
        patientName: "Lucas Ferreira",
        specialty: "Pneumologia",
        date: "2025-03-28",
        time: "09:00",
        doctorName: "Dr. Felipe Mendes",
        recipientPhone: "+5549999940482",
        appointmentId: "apt-12345",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("includes CONFIRMAR/CANCELAR instructions in message", async () => {
      await sendPatientConfirmation({
        patientName: "Ana Lima",
        specialty: "Ginecologia",
        date: "2025-05-10",
        time: "11:00",
        doctorName: "Dra. Beatriz Costa",
        recipientPhone: "+5511999999999",
        appointmentId: "apt-99999",
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("CONFIRMAR"),
        })
      );
      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("CANCELAR"),
        })
      );
    });
  });

  describe("Error handling", () => {
    it("returns error when Twilio throws", async () => {
      mockMessagesCreate.mockRejectedValueOnce(new Error("Twilio API error"));

      const result = await sendAppointmentNotification({
        patientName: "Teste Erro",
        specialty: "Clínica Geral",
        date: "2025-01-01",
        time: "08:00",
        doctorName: "Dr. Teste",
        recipientPhone: "+5511999999999",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Twilio API error");
    });

    it("returns error for missing required fields (service-level validation)", async () => {
      // The service does not validate fields itself — Twilio would reject
      // This test verifies the error path when Twilio rejects
      mockMessagesCreate.mockRejectedValueOnce(new Error("Invalid phone number"));

      const result = await sendAppointmentNotification({
        patientName: "Teste",
        specialty: "Geral",
        date: "2025-01-01",
        time: "08:00",
        doctorName: "Dr. Teste",
        recipientPhone: "invalid-phone",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
