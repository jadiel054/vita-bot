/**
 * WhatsApp Webhook Handler
 * Processes incoming messages from patients confirming or cancelling appointments
 * 
 * In production, this would be called from a webhook endpoint that receives
 * incoming messages from Twilio. The webhook should:
 * 1. Verify the Twilio signature
 * 2. Parse the incoming message
 * 3. Call handlePatientResponse to process the message
 * 4. Return a TwiML response to acknowledge receipt
 */

export interface WhatsAppIncomingMessage {
  From: string; // WhatsApp number e.g., "whatsapp:+5511999999999"
  Body: string; // Message text e.g., "CONFIRMAR" or "CANCELAR"
  MessageSid: string;
}

/**
 * Parse WhatsApp message and extract patient action
 */
export function parsePatientResponse(message: string): "confirm" | "cancel" | null {
  const normalized = message.trim().toUpperCase();

  if (
    normalized.includes("CONFIRMAR") ||
    normalized === "SIM" ||
    normalized === "YES" ||
    normalized === "✅"
  ) {
    return "confirm";
  }

  if (
    normalized.includes("CANCELAR") ||
    normalized === "NÃO" ||
    normalized === "NO" ||
    normalized === "❌"
  ) {
    return "cancel";
  }

  return null;
}

/**
 * Extract phone number from WhatsApp format
 * "whatsapp:+5511999999999" -> "+5511999999999"
 */
export function extractPhoneNumber(whatsappFrom: string): string {
  return whatsappFrom.replace("whatsapp:", "");
}

/**
 * Find appointment by patient phone number
 * Returns the most recent pending appointment for the patient
 * 
 * Note: In a real implementation, this would query the database
 * For now, this is a placeholder that shows the structure
 */
export async function findPatientAppointment(
  patientPhone: string
): Promise<{ id: string; status: string; patientName: string } | null> {
  try {
    // In a real app, you would query your database here
    // Example query would be:
    // SELECT * FROM appointments 
    // WHERE patient_phone = $1 
    // AND status IN ('scheduled', 'confirmed')
    // ORDER BY date DESC LIMIT 1

    console.log(
      "[WhatsApp Webhook] Looking for appointment for phone:",
      patientPhone
    );

    // Placeholder: return null (actual DB query would go here)
    return null;
  } catch (error) {
    console.error("[WhatsApp Webhook] Error finding appointment:", error);
    return null;
  }
}

/**
 * Handle incoming WhatsApp message from patient
 * Updates appointment status based on patient response
 * 
 * This function would be called from the webhook endpoint
 */
export async function handlePatientResponse(
  message: WhatsAppIncomingMessage
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const action = parsePatientResponse(message.Body);

    if (!action) {
      console.log(
        "[WhatsApp Webhook] Unrecognized message format:",
        message.Body
      );
      return {
        success: false,
        message:
          "Desculpe, não entendi sua resposta. Por favor, responda com CONFIRMAR ou CANCELAR.",
      };
    }

    const patientPhone = extractPhoneNumber(message.From);
    const appointment = await findPatientAppointment(patientPhone);

    if (!appointment) {
      console.warn(
        "[WhatsApp Webhook] No pending appointment found for phone:",
        patientPhone
      );
      return {
        success: false,
        message:
          "Não encontramos uma consulta pendente para seu número. Por favor, entre em contato com a clínica.",
      };
    }

    // In a real implementation, you would update the appointment status here
    // For now, just log the action
    if (action === "confirm") {
      console.log(
        `[WhatsApp Webhook] Would confirm appointment ${appointment.id}`
      );

      return {
        success: true,
        message: "✅ Sua consulta foi confirmada! Obrigado por confirmar.",
      };
    } else if (action === "cancel") {
      console.log(
        `[WhatsApp Webhook] Would cancel appointment ${appointment.id}`
      );

      return {
        success: true,
        message:
          "❌ Sua consulta foi cancelada. Você pode agendar uma nova consulta a qualquer momento.",
      };
    }

    return {
      success: false,
      error: "Ação desconhecida",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp Webhook] Error handling patient response:", error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate TwiML response for Twilio webhook
 * This tells Twilio how to respond to the incoming message
 */
export function generateTwiMLResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
