import { describe, it, expect } from "vitest";
import {
  parsePatientResponse,
  extractPhoneNumber,
  handlePatientResponse,
  generateTwiMLResponse,
} from "../server/services/whatsapp-webhook";

describe("WhatsApp Webhook Service", () => {
  describe("parsePatientResponse", () => {
    it("recognizes CONFIRMAR message", () => {
      expect(parsePatientResponse("CONFIRMAR")).toBe("confirm");
      expect(parsePatientResponse("confirmar")).toBe("confirm");
      expect(parsePatientResponse("  CONFIRMAR  ")).toBe("confirm");
    });

    it("recognizes SIM as confirm", () => {
      expect(parsePatientResponse("SIM")).toBe("confirm");
      expect(parsePatientResponse("sim")).toBe("confirm");
    });

    it("recognizes emoji confirm", () => {
      expect(parsePatientResponse("✅")).toBe("confirm");
    });

    it("recognizes CANCELAR message", () => {
      expect(parsePatientResponse("CANCELAR")).toBe("cancel");
      expect(parsePatientResponse("cancelar")).toBe("cancel");
      expect(parsePatientResponse("  CANCELAR  ")).toBe("cancel");
    });

    it("recognizes NÃO as cancel", () => {
      expect(parsePatientResponse("NÃO")).toBe("cancel");
      expect(parsePatientResponse("não")).toBe("cancel");
    });

    it("recognizes emoji cancel", () => {
      expect(parsePatientResponse("❌")).toBe("cancel");
    });

    it("returns null for unrecognized messages", () => {
      expect(parsePatientResponse("Olá")).toBeNull();
      expect(parsePatientResponse("123")).toBeNull();
      expect(parsePatientResponse("")).toBeNull();
    });
  });

  describe("extractPhoneNumber", () => {
    it("extracts phone from WhatsApp format", () => {
      const result = extractPhoneNumber("whatsapp:+5511999999999");
      expect(result).toBe("+5511999999999");
    });

    it("handles different phone formats", () => {
      expect(extractPhoneNumber("whatsapp:+1234567890")).toBe("+1234567890");
      expect(extractPhoneNumber("whatsapp:+55")).toBe("+55");
    });

    it("removes whatsapp: prefix", () => {
      const result = extractPhoneNumber("whatsapp:+5511987654321");
      expect(result).not.toContain("whatsapp:");
    });
  });

  describe("handlePatientResponse", () => {
    it("returns error for unrecognized messages", async () => {
      const result = await handlePatientResponse({
        From: "whatsapp:+5511999999999",
        Body: "Olá",
        MessageSid: "test-123",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("não entendi");
    });

    it("returns error when no appointment found", async () => {
      const result = await handlePatientResponse({
        From: "whatsapp:+5511999999999",
        Body: "CONFIRMAR",
        MessageSid: "test-123",
      });

      expect(result.success).toBe(false);
      expect(result.message?.toUpperCase()).toContain("NÃO ENCONTRAMOS");
    });
  });

  describe("generateTwiMLResponse", () => {
    it("generates valid TwiML XML", () => {
      const xml = generateTwiMLResponse("Teste");
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain("<Response>");
      expect(xml).toContain("<Message>Teste</Message>");
      expect(xml).toContain("</Response>");
    });

    it("escapes XML special characters", () => {
      const xml = generateTwiMLResponse("Teste & <teste>");
      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;");
      expect(xml).toContain("&gt;");
    });

    it("handles quotes in message", () => {
      const xml = generateTwiMLResponse('Mensagem com "aspas"');
      expect(xml).toContain("&quot;");
    });
  });
});
