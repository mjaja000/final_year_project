const express = require('express');
const router = express.Router();
const MessageModel = require('../models/messageModel');
const WhatsappService = require('../services/whatsappService');

// WhatsApp webhook token for verification
const WHATSAPP_WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN || 'matatuconnect-verify-token-2024';

// Store incoming messages for monitoring
let incomingMessages = [];

// Helper function to normalize phone numbers for storage (digits-only)
const normalizePhoneForStorage = (phone) => {
  if (!phone) return null;
  return String(phone).replace(/[^0-9]/g, '');
};

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

    const messageText = (body.Body || '').toLowerCase().trim();
    const userPhone = body.From.replace('whatsapp:', ''); // Remove whatsapp: prefix
    const storagePhone = normalizePhoneForStorage(userPhone);

    try {
      await MessageModel.createWhatsAppMessage({
        phone: storagePhone,
        messageId: body.MessageSid,
        direction: 'incoming',
        messageType: 'incoming_message',
        message: body.Body || '',
        isRead: false
      });
    } catch (dbError) {
      console.error('✗ Failed to store incoming WhatsApp message:', dbError.message);
    }
    try {
      let responseMessage;
      let responseType = 'general_response';

      if (messageText.includes('join') || messageText === 'start') {
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
        responseType = 'join_instructions';
      } else if (messageText.includes('menu') || messageText.includes('help')) {
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
        responseType = 'help_menu';
      } else {
        responseMessage = `Thanks for reaching MatatuConnect. Your message has been received.

You can get notifications by sending:
*join break-additional*
to +1 415 523 8886.

Type "menu" for options.`;
        responseType = 'welcome';
      }

      await WhatsappService.sendMessage(userPhone, responseMessage, responseType);
      console.log('✓ Auto-response sent to:', userPhone);

      const menuOptions = [
        { title: 'Feedback' },
        { title: 'Help' },
        { title: 'Payment status' },
        { title: 'Occupancy' }
      ];

      await WhatsappService.sendInteractiveMessage(
        userPhone,
        'What would you like to do next?',
        menuOptions,
        'post_interaction_menu'
      );
      console.log('✓ Post-interaction menu sent to:', userPhone);
    } catch (error) {
      console.error('✗ Auto-response failed:', error.message);
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

const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return null;
  return String(phone).replace('whatsapp:', '').trim();
};

/**
 * GET /api/whatsapp/chats
 * List WhatsApp contacts with last message time
 */
router.get('/chats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 200;
    const contacts = await MessageModel.listWhatsAppContacts(limit);
    res.json({ success: true, contacts });
  } catch (error) {
    console.error('List WhatsApp contacts failed:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ success: false, error: 'Failed to load WhatsApp contacts', detail: error.message });
  }
});

/**
 * GET /api/whatsapp/chats/:phone
 * Get conversation for a WhatsApp phone number
 */
router.get('/chats/:phone', async (req, res) => {
  try {
    const phone = normalizePhoneForStorage(req.params.phone);
    if (!phone) return res.status(400).json({ success: false, error: 'Missing phone number' });
    const limit = parseInt(req.query.limit, 10) || 200;
    
    const messages = await MessageModel.getWhatsAppConversation(phone, limit);
    
    // Mark incoming messages as read
    try {
      await MessageModel.markWhatsAppRead(phone);
    } catch (err) {
      console.error('Failed to mark messages as read:', err.message);
    }
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Load WhatsApp conversation failed:', error.message);
    res.status(500).json({ success: false, error: 'Failed to load WhatsApp conversation' });
  }
});

/**
 * POST /api/whatsapp/chats/send
 * Body: { phone: string, message: string }
 */
router.post('/chats/send', async (req, res) => {
  const { phone, message } = req.body || {};
  const storagePhone = normalizePhoneForStorage(phone);
  if (!storagePhone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message are required' });
  }

  try {
    const result = await WhatsappService.sendMessage(storagePhone, message, 'admin_chat');
    if (result.success) {
      return res.json({ success: true, messageId: result.messageId });
    }
    // Even if send fails, try to store placeholder
    try {
      await MessageModel.createWhatsAppMessage({
        phone: storagePhone,
        messageId: result.messageId || `failed_${Date.now()}`,
        direction: 'outgoing',
        messageType: 'admin_chat',
        message: message,
        isRead: true
      });
    } catch (dbError) {
      console.error('Failed to store WhatsApp message:', dbError.message);
    }
    return res.status(500).json({ success: false, error: result.error || 'Failed to send message' });
  } catch (error) {
    console.error('Send WhatsApp admin chat failed:', error.message);
    res.status(500).json({ success: false, error: 'Failed to send WhatsApp message' });
  }
});

/**
 * POST /api/whatsapp/chats/invite
 * Body: { phone: string }
 */
router.post('/chats/invite', async (req, res) => {
  const { phone } = req.body || {};
  const storagePhone = normalizePhoneForStorage(phone);
  if (!storagePhone) {
    return res.status(400).json({ success: false, error: 'Phone is required' });
  }

  try {
    const inviteMessage = `👋 Welcome to MatatuConnect WhatsApp support!\n\nSend *join break-additional* to +1 415 523 8886 to activate notifications.\n\nYou can reply with:\n1. Feedback\n2. Help\n3. Payment status\n4. Occupancy`;
    
    // Try to send the invite
    const result = await WhatsappService.sendMessage(storagePhone, inviteMessage, 'admin_invite');
    
    // Always store contact even if send fails
    try {
      await MessageModel.createWhatsAppMessage({
        phone: storagePhone,
        messageId: result.messageId || `placeholder_${Date.now()}`,
        direction: 'outgoing',
        messageType: result.success ? 'admin_invite' : 'system_contact',
        message: result.success ? inviteMessage : 'Contact added (invite pending)',
        isRead: true
      });
    } catch (dbError) {
      console.error('Failed to store WhatsApp contact:', dbError.message);
    }
    
    if (result.success) {
      return res.json({ success: true, messageId: result.messageId });
    }
    
    // Return success anyway since we stored a placeholder
    return res.json({ success: true, messageId: result.messageId || `placeholder_${Date.now()}`, note: 'Contact added with pending invite' });
  } catch (error) {
    console.error('Send WhatsApp invite failed:', error.message);
    
    // Try to at least create placeholder
    try {
      await MessageModel.createWhatsAppMessage({
        phone: storagePhone,
        messageId: `error_${Date.now()}`,
        direction: 'outgoing',
        messageType: 'system_contact',
        message: 'Contact added (invite pending)',
        isRead: true
      });
      res.json({ success: true, note: 'Contact added with placeholder' });
    } catch (dbError) {
      console.error('Failed to create placeholder:', dbError.message);
      res.status(500).json({ success: false, error: 'Failed to add contact' });
    }
  }
});

module.exports = router;
