#!/bin/bash

# Test script to verify the notifyAppointment API endpoint using curl
# Run with: bash server/test-notify-curl.sh

echo ""
echo "🧪 Testing notifyAppointment API Endpoint (HTTP)"
echo "════════════════════════════════════════════════════════════"
echo ""

# HTTP endpoint
PAYLOAD='{
  "patientName": "João Silva",
  "specialty": "Cardiologia",
  "date": "2025-03-20",
  "time": "14:30",
  "doctorName": "Dr. Carlos Santos",
  "recipientPhone": "+5549999940482"
}'

echo "📤 Sending request to: http://localhost:3000/api/whatsapp/notify-appointment"
echo "📋 Payload:"
echo "$PAYLOAD" | jq '.'
echo ""

# Send the request
curl -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  http://localhost:3000/api/whatsapp/notify-appointment 2>/dev/null | jq '.'

echo ""
echo "════════════════════════════════════════════════════════════"
