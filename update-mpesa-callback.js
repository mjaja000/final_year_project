#!/usr/bin/env node

/**
 * Helper script to update M-Pesa callback URL in backend/.env
 * Usage: node update-mpesa-callback.js <your-ngrok-url>
 * Example: node update-mpesa-callback.js https://abc123.ngrok-free.app
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'backend', '.env');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Please provide your ngrok URL');
  console.log('\nUsage:');
  console.log('  node update-mpesa-callback.js <your-ngrok-url>');
  console.log('\nExample:');
  console.log('  node update-mpesa-callback.js https://abc123-xyz456.ngrok-free.app');
  console.log('\nOr get your ngrok URL from: http://localhost:4040/status');
  process.exit(1);
}

const ngrokUrl = args[0].replace(/\/$/, ''); // Remove trailing slash

// Validate URL format
if (!ngrokUrl.startsWith('https://')) {
  console.error('❌ Error: URL must start with https://');
  console.log('Example: https://abc123-xyz456.ngrok-free.app');
  process.exit(1);
}

try {
  // Read current .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Build new callback URL
  const newCallbackUrl = `${ngrokUrl}/api/payments/mpesa/callback`;
  
  // Replace the callback URL line
  const updatedContent = envContent.replace(
    /MPESA_CALLBACK_URL=.*/,
    `MPESA_CALLBACK_URL=${newCallbackUrl}`
  );
  
  // Write back to file
  fs.writeFileSync(envPath, updatedContent, 'utf8');
  
  console.log('✅ Successfully updated M-Pesa callback URL!');
  console.log('\n📍 New callback URL:');
  console.log(`   ${newCallbackUrl}`);
  console.log('\n🔄 Next steps:');
  console.log('   1. Restart your backend server');
  console.log('   2. Test M-Pesa payments');
  console.log('\n💡 Tip: Keep ngrok running while testing M-Pesa!');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}
