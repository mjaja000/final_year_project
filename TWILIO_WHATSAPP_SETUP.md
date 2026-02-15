# Twilio WhatsApp Integration Setup

## ✅ Completed Steps

1. **Installed Twilio SDK** (`npm install twilio`)
2. **Updated WhatsApp Service** to use Twilio API instead of Meta
3. **Added Credentials to .env**:
   - `TWILIO_ACCOUNT_SID=your_account_sid_here`
   - `TWILIO_AUTH_TOKEN=your_auth_token_here`
   - `TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890`
4. **Updated Webhook Handler** to process Twilio's webhook format

## 🔧 Next Steps (Required)

### 1. Join the Twilio WhatsApp Sandbox

From your phone, you **must** send a message to activate sandbox access:

1. Open WhatsApp on your phone
2. Send a message to: **+1 (731) 257-2368**
3. Message text: `join <your-sandbox-code>`
   - Find your sandbox join code at: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Example: `join happy-tiger` (your code will be different)

**Without joining, you cannot receive or send messages to your phone.**

### 2. Configure Webhook URL (For Receiving Messages)

To receive incoming WhatsApp messages:

1. Get a **public URL** for your backend:
   - **Option A (Development)**: Use ngrok
     ```bash
     ngrok http 5000
     ```
     Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
   
   - **Option B (Production)**: Deploy to a server with a public domain

2. Set the webhook in Twilio Console:
   - Go to: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
   - **When a message comes in**: `https://your-domain.com/api/whatsapp/webhook`
   - **Method**: POST
   - Click **Save**

3. Test by sending a WhatsApp message to your sandbox number. Check backend logs to see the webhook payload.

## 📋 Testing the Integration

### Test Sending a Message

**Option 1: Via API Test Endpoint**
```bash
curl -X POST http://localhost:5000/api/whatsapp/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+254712345678",
    "message": "Test message from MatatuConnect"
  }'
```

**Option 2: Via Code**
```javascript
const WhatsappService = require('./src/services/whatsappService');

WhatsappService.sendMessage('+254712345678', 'Hello from MatatuConnect!')
  .then(result => console.log('Result:', result))
  .catch(err => console.error('Error:', err));
```

### Test Receiving Messages

1. Ensure you've joined the sandbox (see step 1 above)
2. Set up webhook URL (see step 2 above)
3. Send a WhatsApp message to: **+1 (731) 257-2368**
4. Check backend console logs - you should see:
   ```
   [WhatsApp] Twilio webhook received: {...}
   ✓ Twilio message stored: {...}
   ```
5. View received messages at: `http://localhost:5000/api/whatsapp/messages`

## 🔐 Important Security Notes

1. **Never commit .env to Git** - Your credentials are already in `.env`, ensure it's in `.gitignore`
2. **Rotate credentials** if you accidentally expose them
3. For production, consider using environment variables from your hosting platform instead of `.env` file

## 📞 Sandbox Limitations

Twilio WhatsApp sandbox has these limits:
- Only pre-approved phone numbers can receive messages (must join sandbox)
- 24-hour conversation window (after user messages you)
- "Sent from your Twilio Sandbox number" footer on all messages
- No custom templates or media in sandbox

For production, you'll need to:
- Request a Twilio WhatsApp-enabled number
- Submit message templates for approval
- Complete WhatsApp Business API verification

## 🧪 Useful Dev Commands

```bash
# Check WhatsApp service status
curl http://localhost:5000/api/whatsapp/status

# View received messages
curl http://localhost:5000/api/whatsapp/messages

# Send test message (if WHATSAPP_TEST_SECRET is not set)
curl -X POST http://localhost:5000/api/whatsapp/test \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+254712345678", "message": "Test"}'
```

## 🆘 Troubleshooting

**Error: "Twilio WhatsApp credentials not configured"**
- Check that `.env` has all three Twilio variables
- Restart your backend server after changing `.env`

**Messages not sending**
- Verify recipient has joined the sandbox
- Check phone number format (must include country code)
- Review backend logs for detailed error messages

**Webhook not receiving messages**
- Confirm webhook URL is publicly accessible
- Check Twilio Console > Debugger for webhook errors
- Verify webhook URL ends with `/api/whatsapp/webhook`

## 📚 Additional Resources

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio WhatsApp Sandbox](https://www.twilio.com/docs/whatsapp/sandbox)
- [Twilio Console](https://console.twilio.com/)
