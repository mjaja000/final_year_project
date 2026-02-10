const express = require('express');
const { telegramWebhook } = require('../controllers/telegramController');

const router = express.Router();

router.post('/webhook', telegramWebhook);

module.exports = router;
