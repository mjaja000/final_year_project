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
 * Receives incoming WhatsApp messages, status updates, and other webhooks
 */
router.post('/webhook', async (req, res) => {
  const body = req.body;

  // Always acknowledge receipt immediately
  res.status(200).json({ received: true });

  console.log('[WhatsApp] Webhook received:', JSON.stringify(body, null, 2));

  // Check if this is a message event
  if (body.object === 'whatsapp_business_account') {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Handle incoming messages
    if (value?.messages) {
      const message = value.messages[0];
      const senderPhone = message.from;
      const messageId = message.id;
      const timestamp = message.timestamp;

      let messageContent = {
        type: message.type,
        from: senderPhone,
        id: messageId,
        timestamp: new Date(timestamp * 1000).toISOString(),
      };

      // Extract message content based on type
      if (message.type === 'text') {
        messageContent.text = message.text?.body || '';
      } else if (message.type === 'button') {
        messageContent.button = message.button?.payload || '';
      } else if (message.type === 'interactive') {
        messageContent.interactive = message.interactive?.button_reply?.id || '';
      } else if (message.type === 'image' || message.type === 'document') {
        messageContent.mediaId = message[message.type]?.id || '';
      }

      // Store message
      incomingMessages.push(messageContent);
      if (incomingMessages.length > 1000) {
        incomingMessages = incomingMessages.slice(-1000); // Keep last 1000 messages
      }

      console.log('✓ Message stored:', messageContent);

      // Handle message status updates
      if (value?.statuses) {
        const status = value.statuses[0];
        console.log(`[WhatsApp] Message status: ${status.status} for message ${status.id}`);
      }
    }

    // Handle delivery and read receipts
    if (value?.statuses) {
      const status = value.statuses[0];
      const statusMap = {
        sent: '📤 Message sent',
        delivered: '✓ Message delivered',
        read: '✓✓ Message read',
        failed: '✗ Message failed'
      };

      console.log(`[WhatsApp] ${statusMap[status.status] || status.status} - ID: ${status.id}`);
    }
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
  const configured = !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

  res.json({
    service: 'WhatsApp Business API',
    configured: configured,
    phoneNumberId: configured ? process.env.WHATSAPP_PHONE_NUMBER_ID?.substring(0, 5) + '***' : 'not set',
    webhookConfigured: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
    messagesReceived: incomingMessages.length,
    lastMessage: incomingMessages[incomingMessages.length - 1] || null
  });
});

module.exports = router;
