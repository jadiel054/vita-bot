import twilio from "twilio";

/**
 * WhatsApp Notification Service via Twilio
 * Sends appointment notifications to clinic owner
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

/**
 * Initialize Twilio client (lazy load)
 */
function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.warn(
      "[WhatsApp] Twilio credentials not configured. Notifications disabled."
    );
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

/**
 * Check if WhatsApp notifications are enabled
 */
export function isWhatsAppEnabled(): boolean {
  return !!(accountSid && authToken && twilioWhatsappNumber);
}

/**
 * Send appointment notification to clinic owner
 */
export async function sendAppointmentNotification(params: {
  patientName: string;
  specialty: string;
  date: string; // ISO format "2025-01-15"
  time: string; // "14:30"
  doctorName: string;
  recipientPhone: string; // WhatsApp number with country code, e.g., "+5511999999999"
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isWhatsAppEnabled()) {
      console.warn("[WhatsApp] Service not configured, skipping notification");
      return { success: false, error: "WhatsApp service not configured" };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, error: "Failed to initialize Twilio client" };
    }

    // Format date for display (ISO to BR format)
    const [year, month, day] = params.date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    const message = `Nova consulta agendada! 📅

Paciente: ${params.patientName}
Especialidade: ${params.specialty}
Médico: Dr(a). ${params.doctorName}
Data: ${formattedDate}
Horário: ${params.time}

Acesse o painel admin para mais detalhes.`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsappNumber}`,
      to: `whatsapp:${params.recipientPhone}`,
      body: message,
    });

    console.log(
      `[WhatsApp] Notification sent successfully. SID: ${result.sid}`
    );

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp] Failed to send notification:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send appointment cancellation notification
 */
export async function sendCancellationNotification(params: {
  patientName: string;
  specialty: string;
  date: string;
  time: string;
  doctorName: string;
  recipientPhone: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isWhatsAppEnabled()) {
      console.warn("[WhatsApp] Service not configured, skipping notification");
      return { success: false, error: "WhatsApp service not configured" };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, error: "Failed to initialize Twilio client" };
    }

    // Format date for display
    const [year, month, day] = params.date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    const message = `Consulta cancelada ❌

Paciente: ${params.patientName}
Especialidade: ${params.specialty}
Médico: Dr(a). ${params.doctorName}
Data: ${formattedDate}
Horário: ${params.time}

${params.reason ? `Motivo: ${params.reason}` : ""}

Acesse o painel admin para mais detalhes.`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsappNumber}`,
      to: `whatsapp:${params.recipientPhone}`,
      body: message,
    });

    console.log(
      `[WhatsApp] Cancellation notification sent. SID: ${result.sid}`
    );

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[WhatsApp] Failed to send cancellation notification:",
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send appointment confirmation to patient with interactive instructions
 * Patient can reply with CONFIRMAR or CANCELAR
 */
export async function sendPatientConfirmation(params: {
  patientName: string;
  specialty: string;
  date: string;
  time: string;
  doctorName: string;
  recipientPhone: string;
  appointmentId: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isWhatsAppEnabled()) {
      console.warn(
        "[WhatsApp] Service not configured, skipping patient confirmation"
      );
      return { success: false, error: "WhatsApp service not configured" };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, error: "Failed to initialize Twilio client" };
    }

    // Format date for display
    const [year, month, day] = params.date.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    // Create message with interactive instructions
    const message = `Olá ${params.patientName}! 👋\n\nSua consulta foi agendada com sucesso! ✅\n\n📋 Detalhes da Consulta:\n• Especialidade: ${params.specialty}\n• Médico: Dr(a). ${params.doctorName}\n• Data: ${formattedDate}\n• Horário: ${params.time}\n\n🔔 Por favor, confirme o recebimento respondendo com:\n\n✅ CONFIRMAR\nPara confirmar que receberá a consulta\n\n❌ CANCELAR\nPara cancelar a consulta\n\nQualquer dúvida, estamos à disposição! 💬`;

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsappNumber}`,
      to: `whatsapp:${params.recipientPhone}`,
      body: message,
    });

    console.log(
      `[WhatsApp] Patient confirmation sent successfully. SID: ${result.sid}`
    );

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      "[WhatsApp] Failed to send patient confirmation:",
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send test notification (for validation)
 */
export async function sendTestNotification(
  recipientPhone: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!isWhatsAppEnabled()) {
      return { success: false, error: "WhatsApp service not configured" };
    }

    const client = getTwilioClient();
    if (!client) {
      return { success: false, error: "Failed to initialize Twilio client" };
    }

    const result = await client.messages.create({
      from: `whatsapp:${twilioWhatsappNumber}`,
      to: `whatsapp:${recipientPhone}`,
      body: "✅ Teste de notificação VitaBot — Sistema funcionando corretamente!",
    });

    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[WhatsApp] Failed to send test notification:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
