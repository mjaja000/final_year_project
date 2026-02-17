const TelegramBot = require('node-telegram-bot-api');
const { handleTelegramStartMessage } = require('./handleStart');

const token = process.env.TELEGRAM_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

if (!token) {
  console.warn('⚠️ TELEGRAM_TOKEN is not set. Telegram bot is disabled.');
}

const useWebhook = Boolean(token && webhookUrl);
const bot = token
  ? new TelegramBot(token, useWebhook ? { webHook: true } : { polling: true })
  : null;

if (bot && !useWebhook) {
  bot.on('message', async (msg) => {
    if (msg?.text && msg.text.startsWith('/start')) {
      try {
        await handleTelegramStartMessage(bot, msg);
      } catch (error) {
        console.error('Telegram polling handler failed:', error.message);
      }
    }
  });
}

module.exports = { bot };
