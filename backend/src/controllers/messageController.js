const MessageModel = require('../models/messageModel');
const ActivityLogModel = require('../models/activityLogModel');

class MessageController {
  static async sendMessage(req, res) {
    try {
      const senderId = req.userId;
      const { receiverId, tripId, message } = req.body;
      if (!receiverId || !message) return res.status(400).json({ message: 'Missing receiverId or message' });

      const msg = await MessageModel.createMessage({ senderId, receiverId, tripId: tripId || null, message });

      // log activity
      try {
        await ActivityLogModel.logActivity(senderId, 'chat_message_sent', 'message', msg.id, JSON.stringify({ receiverId }), req.ip || null);
      } catch (e) { console.error('Failed to log chat message:', e); }

      // Emit via socket
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${receiverId}`).emit('chat.message', msg);
        // notify admin room if receiver is admin or if sender is driver
        io.to('admin').emit('chat.notification', { message: 'New chat message', from: senderId, to: receiverId, tripId: tripId || null });
      }

      res.status(201).json({ message: 'Message sent', msg });
    } catch (error) {
      console.error('Send message error:', error.message);
      res.status(500).json({ message: 'Failed to send message', error: error.message });
    }
  }

  static async getConversation(req, res) {
    try {
      const userId = req.userId;
      const otherId = parseInt(req.query.otherId, 10);
      if (!otherId) return res.status(400).json({ message: 'Missing otherId' });
      const conv = await MessageModel.getConversationBetween(userId, otherId, 1000);
      res.json({ messages: conv });
    } catch (error) {
      console.error('Get conversation error:', error.message);
      res.status(500).json({ message: 'Failed to fetch conversation', error: error.message });
    }
  }

  static async getUnreadCounts(req, res) {
    try {
      const userId = req.userId;
      const count = await MessageModel.getUnreadCountForReceiver(userId);
      res.json({ unread: count });
    } catch (error) {
      console.error('Get unread counts error:', error.message);
      res.status(500).json({ message: 'Failed to fetch unread counts', error: error.message });
    }
  }

  static async getAdminRecent(req, res) {
    try {
      const activities = await MessageModel.listRecentConversationsForAdmin(100);
      res.json({ total: activities.length, activities });
    } catch (error) {
      console.error('Get admin recent messages error:', error.message);
      res.status(500).json({ message: 'Failed to fetch recent messages', error: error.message });
    }
  }

  static async markRead(req, res) {
    try {
      const { ids } = req.body; // array of ids
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Missing ids' });
      const rows = await MessageModel.markRead(ids);
      res.json({ updated: rows.length, rows });
    } catch (error) {
      console.error('Mark read error:', error.message);
      res.status(500).json({ message: 'Failed to mark messages read', error: error.message });
    }
  }
}

module.exports = MessageController;