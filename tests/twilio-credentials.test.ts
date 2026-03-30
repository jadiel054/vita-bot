import { describe, it, expect } from "vitest";
import twilio from "twilio";

/**
 * Twilio Credentials Validation Tests
 *
 * These tests validate the format of Twilio credentials when present.
 * In CI/CD environments without real credentials, tests are skipped gracefully.
 * In production environments, all credentials must be set.
 */
describe("Twilio Credentials Validation", () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const clinicWhatsapp = process.env.CLINIC_WHATSAPP;

  const hasCredentials = !!(accountSid && authToken && whatsappNumber);

  it("should have Twilio credentials configured (skipped if not set)", () => {
    if (!hasCredentials) {
      // In CI without real credentials, just verify the env vars are accessible
      console.info("[Twilio Test] Credentials not set — skipping live validation.");
      expect(typeof accountSid === "string" || accountSid === undefined).toBe(true);
      return;
    }

    expect(accountSid).toMatch(/^AC/); // Twilio Account SIDs start with AC
    expect(authToken?.length).toBeGreaterThan(0);
    expect(whatsappNumber).toMatch(/^\+\d+/); // Should start with +
  });

  it("should be able to initialize Twilio client with credentials", () => {
    if (!hasCredentials) {
      // Without credentials, just verify the twilio module loads
      expect(typeof twilio).toBe("function");
      return;
    }

    expect(() => {
      twilio(accountSid, authToken);
    }).not.toThrow();
  });

  it("should have valid phone number formats when configured", () => {
    if (!whatsappNumber || !clinicWhatsapp) {
      console.info("[Twilio Test] Phone numbers not set — skipping format validation.");
      expect(true).toBe(true); // Pass gracefully
      return;
    }

    // Valid phone format: +[country code][number]
    const phoneRegex = /^\+\d{10,15}$/;
    expect(whatsappNumber).toMatch(phoneRegex);
    expect(clinicWhatsapp).toMatch(phoneRegex);
  });

  it("should have Twilio WhatsApp sender number with valid format when configured", () => {
    if (!whatsappNumber) {
      console.info("[Twilio Test] TWILIO_WHATSAPP_NUMBER not set — skipping.");
      expect(true).toBe(true);
      return;
    }

    // Twilio sandbox number starts with +1 (US), production can be any country code
    expect(whatsappNumber).toMatch(/^\+\d{10,15}$/);
  });

  it("should have clinic WhatsApp number with Brazil country code when configured", () => {
    if (!clinicWhatsapp) {
      console.info("[Twilio Test] CLINIC_WHATSAPP not set — skipping.");
      expect(true).toBe(true);
      return;
    }

    // Brazil country code is +55
    expect(clinicWhatsapp).toMatch(/^\+55\d{10,11}$/);
  });
});
