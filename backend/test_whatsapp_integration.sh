#!/bin/bash

echo "🧪 Testing WhatsApp Integration via All Methods"
echo "================================================"
echo ""

# Test 1: Check service status
echo "1️⃣ Checking WhatsApp service status..."
STATUS=$(curl -s http://localhost:5000/api/whatsapp/status)
echo "$STATUS" | python3 -m json.tool
echo ""

# Test 2: Send via test endpoint
echo "2️⃣ Sending test message via API..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254719319834", "message": "Test from automated script ✅"}')
  
SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['success'])")

if [ "$SUCCESS" = "True" ]; then
  MESSAGE_SID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['details']['messageId'])")
  echo "✅ Message sent successfully!"
  echo "   Message SID: $MESSAGE_SID"
else
  echo "❌ Failed to send message"
  echo "$RESPONSE" | python3 -m json.tool
fi
echo ""

# Test 3: Check backend health
echo "3️⃣ Checking backend health..."
HEALTH=$(curl -s http://localhost:5000/health)
echo "$HEALTH" | python3 -m json.tool
echo ""

echo "================================================"
echo "✅ All tests complete!"
echo ""
echo "📱 To receive messages, your phone (+254719319834) must:"
echo "   1. Send 'join break-additional' to +1 (415) 523-8886"
echo "   2. Wait for confirmation"
echo "   3. Then you can send/receive messages"
echo ""
echo "🌐 To receive webhooks, set up ngrok:"
echo "   ngrok http 5000"
echo "   Then configure in Twilio Console"
