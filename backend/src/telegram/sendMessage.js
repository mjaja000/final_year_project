const axios = require('axios');

const sendTelegramMessage = async (chatId, message) => {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_TOKEN is not configured');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await axios.post(url, {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });
};

module.exports = { sendTelegramMessage };
