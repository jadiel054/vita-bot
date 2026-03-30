/**
 * Test script to verify WhatsApp notifications are working
 * Run with: npx tsx server/test-whatsapp.ts
 */

import {
  sendAppointmentNotification,
  sendPatientConfirmation,
  sendTestNotification,
  isWhatsAppEnabled,
} from "./services/whatsapp";

async function runTests() {
  console.log("\n🧪 VitaBot WhatsApp Integration Tests\n");
  console.log("═".repeat(50));

  // Check if WhatsApp is enabled
  console.log("\n1️⃣  Checking if WhatsApp is configured...");
  const enabled = isWhatsAppEnabled();
  if (!enabled) {
    console.error("❌ WhatsApp not configured. Check environment variables:");
    console.error("   - TWILIO_ACCOUNT_SID");
    console.error("   - TWILIO_AUTH_TOKEN");
    console.error("   - TWILIO_WHATSAPP_NUMBER");
    process.exit(1);
  }
  console.log("✅ WhatsApp is configured and ready");

  // Test 1: Send test notification
  console.log("\n2️⃣  Sending test notification to clinic...");
  const clinicPhone = process.env.CLINIC_WHATSAPP;
  if (!clinicPhone) {
    console.error("❌ CLINIC_WHATSAPP not configured");
    process.exit(1);
  }

  const testResult = await sendTestNotification(clinicPhone);
  if (testResult.success) {
    console.log("✅ Test notification sent successfully");
    console.log(`   Message ID: ${testResult.messageId}`);
  } else {
    console.error("❌ Failed to send test notification");
    console.error(`   Error: ${testResult.error}`);
    process.exit(1);
  }

  // Test 2: Send appointment notification to clinic
  console.log("\n3️⃣  Sending appointment notification to clinic...");
  const appointmentResult = await sendAppointmentNotification({
    patientName: "João Silva",
    specialty: "Cardiologia",
    date: "2025-03-20",
    time: "14:30",
    doctorName: "Dr. Carlos Santos",
    recipientPhone: clinicPhone,
  });

  if (appointmentResult.success) {
    console.log("✅ Appointment notification sent to clinic");
    console.log(`   Message ID: ${appointmentResult.messageId}`);
  } else {
    console.error("❌ Failed to send appointment notification");
    console.error(`   Error: ${appointmentResult.error}`);
  }

  // Test 3: Send patient confirmation
  console.log("\n4️⃣  Sending confirmation to patient...");
  const patientPhone = "+5549999940482"; // Using clinic phone as test
  const confirmationResult = await sendPatientConfirmation({
    patientName: "João Silva",
    specialty: "Cardiologia",
    date: "2025-03-20",
    time: "14:30",
    doctorName: "Dr. Carlos Santos",
    recipientPhone: patientPhone,
    appointmentId: "test-123",
  });

  if (confirmationResult.success) {
    console.log("✅ Patient confirmation sent");
    console.log(`   Message ID: ${confirmationResult.messageId}`);
  } else {
    console.error("❌ Failed to send patient confirmation");
    console.error(`   Error: ${confirmationResult.error}`);
  }

  console.log("\n" + "═".repeat(50));
  console.log("\n✨ All tests completed!");
  console.log("\n📱 Check your WhatsApp messages on the clinic phone:");
  console.log(`   ${clinicPhone}\n`);
}

runTests().catch((error) => {
  console.error("❌ Test script failed:", error);
  process.exit(1);
});
