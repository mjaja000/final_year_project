require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  console.error('❌ Missing Twilio credentials in .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Replace with your phone number (the one you'll use to join sandbox)
const YOUR_PHONE = '+254719319834'; // Update if different

console.log('🚀 Sending WhatsApp message...');
console.log(`From: ${whatsappNumber}`);
console.log(`To: whatsapp:${YOUR_PHONE}`);

client.messages
  .create({
    from: whatsappNumber,
    body: '✅ Hello from MatatuConnect! Your Twilio WhatsApp integration is working perfectly. 🎉',
    to: `whatsapp:${YOUR_PHONE}`
  })
  .then(message => {
    console.log('✅ Message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to send message:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.moreInfo) console.error('More info:', error.moreInfo);
    process.exit(1);
  });
