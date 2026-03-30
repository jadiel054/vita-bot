/**
 * Test script to verify the notifyAppointment API endpoint
 * Run with: npx tsx server/test-notify-api.ts
 */

const API_URL = "http://localhost:3000/api/trpc/vitabot.notifyAppointment";

async function testNotifyAPI() {
  console.log("\n🧪 Testing notifyAppointment API Endpoint\n");
  console.log("═".repeat(60));

  const payload = {
    patientName: "João Silva",
    specialty: "Cardiologia",
    date: "2025-03-20",
    time: "14:30",
    doctorName: "Dr. Carlos Santos",
    recipientPhone: "+5549999940482",
  };

  console.log("\n📤 Sending request to:", API_URL);
  console.log("📋 Payload:", JSON.stringify(payload, null, 2));

  try {
    // tRPC expects input in query string for GET or in body as JSON
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("\n📨 Response Status:", response.status);

    const data = await response.text();
    console.log("\n📄 Response Body:");
    console.log(data);

    if (response.ok) {
      try {
        const json = JSON.parse(data);
        console.log("\n✅ API Response (parsed):");
        console.log(JSON.stringify(json, null, 2));
        
        if (json.result?.data?.success) {
          console.log("\n✨ Message sent successfully!");
          console.log("Message ID:", json.result.data.messageId);
        }
      } catch {
        console.log("\n⚠️  Could not parse response as JSON");
      }
    } else {
      console.log("\n❌ API request failed");
      try {
        const errorJson = JSON.parse(data);
        console.log("Error details:", JSON.stringify(errorJson, null, 2));
      } catch {
        // ignore
      }
    }
  } catch (error) {
    console.error("\n❌ Request failed:", error);
  }

  console.log("\n" + "═".repeat(60));
}

testNotifyAPI();
