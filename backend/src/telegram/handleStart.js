const TelegramConnectionModel = require('../models/telegramConnectionModel');
const UserModel = require('../models/userModel');

const handleTelegramStartMessage = async (bot, msg) => {
  if (!bot || !msg) return;

  const chatId = msg.chat?.id;
  const telegramId = msg.from?.id;
  const text = msg.text || '';
  const payload = text.replace('/start', '').trim();
  const userId = payload && /^\d+$/.test(payload) ? Number(payload) : null;

  if (!chatId || !telegramId) return;

  await TelegramConnectionModel.saveConnection(telegramId, chatId);

  if (userId) {
    await UserModel.updateTelegramConnection(userId, telegramId, chatId);
  }

  await bot.sendMessage(
    chatId,
    userId
      ? '✅ Telegram connected successfully! You will now receive notifications.'
      : '✅ Telegram connected. To link to your account, open the link from the app.'
  );
};

module.exports = { handleTelegramStartMessage };
