#!/bin/bash

# WhatsApp Auto-Helper Test Script
# Tests the new sandbox join automation features

echo "🧪 Testing WhatsApp Auto-Helper Features"
echo "========================================"
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Check WhatsApp status
echo "1. Checking WhatsApp service status..."
curl -s "$BASE_URL/api/whatsapp/status" | jq '.'
echo ""

# Test 2: Send join instructions (will send SMS if user not in sandbox)
echo "2. Testing send join instructions endpoint..."
echo "   This will send SMS with join code to the phone number"
curl -s -X POST "$BASE_URL/api/whatsapp/send-join-instructions" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254719319834"}' | jq '.'
echo ""

# Test 3: Try sending a regular WhatsApp message
echo "3. Testing WhatsApp message send (may fail if not joined)..."
curl -s -X POST "$BASE_URL/api/whatsapp/test" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+254719319834", "message": "Test from auto-helper"}' | jq '.'
echo ""

# Test 4: Check recent incoming messages
echo "4. Checking recent incoming WhatsApp messages..."
curl -s "$BASE_URL/api/whatsapp/messages?limit=5" | jq '.'
echo ""

echo "✅ Test complete!"
echo ""
echo "📝 Notes:"
echo "  - If user not in sandbox, you'll get SMS with join instructions"
echo "  - After user sends 'join break-additional' to +1 415 523 8886"
echo "  - Future WhatsApp messages will work perfectly"
echo "  - Auto-responder activates when user texts Hi/Hello/Help/Join"
echo ""
echo "💡 To test auto-responder:"
echo "  1. Send 'Hi' to +1 415 523 8886 on WhatsApp"
echo "  2. Check backend logs for auto-response confirmation"
echo "  3. You should receive welcome message instantly"
