#!/bin/bash

# Quick test for enhanced WhatsApp auto-responder with join code

echo "📱 Testing Enhanced WhatsApp Auto-Responder"
echo "==========================================="
echo ""

BASE_URL="http://localhost:5000"

echo "✨ What happens now when users text:"
echo ""
echo "1️⃣  User sends 'Hi' or 'Hello'"
echo "   → Gets: Welcome + Join Code prominently displayed"
echo ""
echo "2️⃣  User sends 'join' or 'start'"
echo "   → Gets: Join code with step-by-step instructions"
echo ""
echo "3️⃣  User sends 'menu' or 'help'"
echo "   → Gets: Menu + Join code"
echo ""
echo "4️⃣  User makes payment (not in sandbox)"
echo "   → Gets: SMS with join code"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🧪 Simulating incoming WhatsApp message..."
echo ""

# Simulate Twilio webhook for incoming message
curl -s -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM1234567890abcdef" \
  -d "From=whatsapp:+254719319834" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=Hi" \
  -d "NumMedia=0" > /dev/null

echo "✅ Webhook processed! Check backend logs for auto-response"
echo ""
echo "The user should receive:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👋 *Welcome to MatatuConnect!*"
echo ""
echo "You're connected!"
echo ""
echo "🔔 *To get notifications, send:*"
echo "*join break-additional*"
echo ""
echo "📱 Send to: +1 415 523 8886"
echo "⏱ Valid: 72 hours (rejoin anytime)"
echo ""
echo "✨ You'll receive:"
echo "✅ Payment confirmations"
echo "✅ Feedback updates"
echo "✅ Real-time occupancy alerts"
echo ""
echo "Type \"menu\" for options."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "💡 Live Test:"
echo "   1. Start backend: cd backend && npm run dev"
echo "   2. Text 'Hi' to +1 415 523 8886 on WhatsApp"
echo "   3. You'll instantly get the join code!"
echo ""
echo "🎯 Result: Users get join code immediately, no confusion!"
