const { bot } = require('../telegram/bot');
const { handleTelegramStartMessage } = require('../telegram/handleStart');

const telegramWebhook = async (req, res) => {
  if (!bot) {
    return res.status(503).json({ message: 'Telegram bot is not configured' });
  }

  try {
    bot.processUpdate(req.body);

    const msg = req.body?.message;

    if (msg?.text && msg.text.startsWith('/start')) {
      await handleTelegramStartMessage(bot, msg);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return res.status(500).json({ message: 'Failed to process Telegram webhook', error: error.message });
  }
};

module.exports = { telegramWebhook };
