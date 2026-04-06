const express = require('express');
const MessageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Send message
router.post('/', authMiddleware, MessageController.sendMessage);
// Get conversation between logged user and another user (query ?otherId=)
router.get('/conversation', authMiddleware, MessageController.getConversation);
// Get unread count for logged user
router.get('/unread', authMiddleware, MessageController.getUnreadCounts);
// Admin: recent messages overview
router.get('/admin/recent', authMiddleware, MessageController.getAdminRecent);
// Driver: get admin user for chat
router.get('/admin-user', authMiddleware, MessageController.getAdminUser);
// Mark read
router.put('/mark_read', authMiddleware, MessageController.markRead);

module.exports = router;