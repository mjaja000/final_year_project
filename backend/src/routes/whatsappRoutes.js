const express = require('express');
const router = express.Router();

// WhatsApp webhook token for verification
const WHATSAPP_WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || 'matatuconnect-verify-token-2024';

// Store incoming messages for monitoring
let incomingMessages = [];

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint - WhatsApp calls this to verify the webhook URL
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[WhatsApp] Webhook verification request:`, { mode, token: token ? '***' : 'missing' });

  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_TOKEN) {
    console.log('✓ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('✗ WhatsApp webhook verification failed - invalid token');
    res.status(403).json({ error: 'Invalid verification token' });
  }
});

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages from Twilio
 */
router.post('/webhook', async (req, res) => {
  const body = req.body;

  // Always acknowledge receipt immediately (Twilio expects empty 200)
  res.status(200).send();

  console.log('[WhatsApp] Twilio webhook received:', JSON.stringify(body, null, 2));

  // Twilio sends messages in req.body with these fields:
  // MessageSid, From, To, Body, NumMedia, etc.
  
  if (body.MessageSid && body.From) {
    const messageContent = {
      type: 'text',
      from: body.From, // Format: whatsapp:+1234567890
      to: body.To,
      id: body.MessageSid,
      timestamp: new Date().toISOString(),
      text: body.Body || '',
      numMedia: parseInt(body.NumMedia || '0', 10),
      status: body.SmsStatus || 'received',
    };

    // Store message
    incomingMessages.push(messageContent);
    if (incomingMessages.length > 1000) {
      incomingMessages = incomingMessages.slice(-1000); // Keep last 1000 messages
    }

    console.log('✓ Twilio message stored:', messageContent);

    // Auto-respond to EVERY message with join code and helpful info
    const messageText = (body.Body || '').toLowerCase().trim();
    const userPhone = body.From.replace('whatsapp:', ''); // Remove whatsapp: prefix
    
    // Check if this looks like a command or question
    const isCommand = messageText.includes('join') || 
                      messageText.includes('help') || 
                      messageText.includes('start') ||
                      messageText.includes('hi') ||
                      messageText.includes('hello') ||
                      messageText.includes('menu') ||
                      messageText.length < 50; // Short messages likely need help
    
    if (isCommand) {
      // Send helpful response via Twilio with JOIN CODE prominently displayed
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        // Customize message based on what user sent
        let responseMessage;
        
        if (messageText.includes('join') || messageText === 'start') {
          // User asking about joining - give them the join code!
          responseMessage = `🎯 *MatatuConnect WhatsApp Setup*

To activate notifications, send this message:

*join break-additional*

📱 Send it to: +1 415 523 8886

That's it! Valid for 72 hours. Rejoin anytime.

After joining, you'll receive:
✅ Payment confirmations
✅ Feedback updates
✅ Occupancy alerts

Type "menu" for more options.`;
        } else if (messageText.includes('menu') || messageText.includes('help')) {
          // User wants to see menu
          responseMessage = `📋 *MatatuConnect Menu*

🔔 *Join WhatsApp Notifications:*
Send: *join break-additional*
To: +1 415 523 8886

💡 *Available Services:*
• Payment confirmations
• Feedback tracking
• Vehicle occupancy updates
• Real-time alerts

📞 Need help? Reply "support"`;
        } else {
          // Default friendly welcome with join code
          responseMessage = `👋 *Welcome to MatatuConnect!*

You're connected! 

🔔 *To get notifications, send:*
*join break-additional*

📱 Send to: +1 415 523 8886
⏱ Valid: 72 hours (rejoin anytime)

✨ You'll receive:
✅ Payment confirmations
✅ Feedback updates
✅ Real-time occupancy alerts

Type "menu" for options.`;
        }
        
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
          to: body.From,
          body: responseMessage
        });
        console.log('✓ Auto-response with join code sent to:', userPhone);
      } catch (error) {
        console.error('✗ Auto-response failed:', error.message);
      }
    }

    // TODO: Add logic here to route messages to admin/driver chat
    // Example: parse body.Body for commands, match body.From to registered users
  } else if (body.MessageStatus) {
    // Handle status callbacks (sent, delivered, read, failed)
    const statusMap = {
      sent: '📤 Message sent',
      delivered: '✓ Message delivered',
      read: '✓✓ Message read',
      failed: '✗ Message failed'
    };
    console.log(`[WhatsApp] ${statusMap[body.MessageStatus] || body.MessageStatus} - SID: ${body.MessageSid}`);
  }
});

/**
 * GET /api/whatsapp/messages
 * Get incoming messages (for monitoring/debugging)
 */
router.get('/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const messages = incomingMessages.slice(-limit);

  res.json({
    total: incomingMessages.length,
    returned: messages.length,
    messages
  });
});

/**
 * GET /api/whatsapp/status
 * Check WhatsApp service status
 */
router.get('/status', (req, res) => {
  const configured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER);

  res.json({
    service: 'Twilio WhatsApp API',
    configured: configured,
    whatsappNumber: configured ? process.env.TWILIO_WHATSAPP_NUMBER : 'not set',
    accountSid: configured ? process.env.TWILIO_ACCOUNT_SID?.substring(0, 5) + '***' : 'not set',
    webhookConfigured: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
    messagesReceived: incomingMessages.length,
    lastMessage: incomingMessages[incomingMessages.length - 1] || null
  });
});

/**
 * POST /api/whatsapp/test
 * Body: { phone: string, message?: string, secret?: string }
 * Sends a test WhatsApp message using backend service. If WHATSAPP_TEST_SECRET is set in env, it will be validated.
 */
router.post('/test', async (req, res) => {
  const { phone, message = 'MatatuConnect WhatsApp test message', secret } = req.body || {};

  // Optional secret guard - set WHATSAPP_TEST_SECRET in your environment to require a secret
  if (process.env.WHATSAPP_TEST_SECRET && secret !== process.env.WHATSAPP_TEST_SECRET) {
    return res.status(403).json({ success: false, error: 'Invalid test secret' });
  }

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Missing phone number' });
  }

  try {
    const WhatsappService = require('../services/whatsappService');
    const result = await WhatsappService.sendServiceAlert(phone, message);
    if (result && result.success) {
      return res.json({ success: true, message: 'Test message sent', details: result });
    }
    return res.status(500).json({ success: false, error: result.error || 'Failed to send test message', details: result });
  } catch (err) {
    console.error('WhatsApp test send failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
});

/**
 * POST /api/whatsapp/send-join-instructions
 * Body: { phone: string }
 * Sends sandbox join instructions to a user (via SMS fallback if WhatsApp fails)
 */
router.post('/send-join-instructions', async (req, res) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Missing phone number' });
  }

  try {
    const WhatsappService = require('../services/whatsappService');
    const whatsappService = new WhatsappService();
    
    // Try WhatsApp first
    const result = await whatsappService.sendJoinInstructions(phone);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Join instructions sent via WhatsApp',
        channel: 'whatsapp',
        details: result 
      });
    }
    
    // If WhatsApp fails (user not joined), send SMS as fallback
    if (result.needsJoin || result.code === 63007) {
      try {
        const SmsService = require('../services/smsService');
        const smsMessage = `MatatuConnect: To receive WhatsApp notifications, send "join break-additional" to +1 415 523 8886 on WhatsApp. Valid for 72hrs. Rejoin anytime!`;
        
        await SmsService.sendSms(phone, smsMessage);
        
        return res.json({
          success: true,
          message: 'Join instructions sent via SMS (user not in WhatsApp sandbox)',
          channel: 'sms',
          note: 'User needs to join sandbox first to receive WhatsApp messages'
        });
      } catch (smsError) {
        console.error('SMS fallback failed:', smsError);
        return res.status(500).json({
          success: false,
          error: 'Failed to send instructions via both WhatsApp and SMS',
          whatsappError: result.error,
          smsError: smsError.message
        });
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      error: result.error || 'Failed to send join instructions',
      details: result 
    });
  } catch (err) {
    console.error('Send join instructions failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
});

module.exports = router;
