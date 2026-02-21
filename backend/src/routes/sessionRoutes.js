const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const SessionModel = require('../models/sessionModel');

const router = express.Router();

// Get current user's sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const sessions = await SessionModel.getUserSessions(userId);
    
    // Format response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceInfo: session.device_info,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastActivity: session.last_activity,
      isActive: session.is_active,
      isCurrent: session.token === req.token
    }));

    res.json({
      message: 'Sessions retrieved successfully',
      sessions: formattedSessions
    });
  } catch (error) {
    console.error('Error retrieving sessions:', error);
    res.status(500).json({ message: 'Failed to retrieve sessions', error: error.message });
  }
});

// Logout from all other devices
router.post('/logout-other-devices', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const currentToken = req.token;
    
    // Invalidate all sessions except current one
    await SessionModel.invalidateAllOtherSessions(userId, currentToken);
    
    res.json({ message: 'All other sessions have been logged out' });
  } catch (error) {
    console.error('Error logging out other devices:', error);
    res.status(500).json({ message: 'Failed to logout other devices', error: error.message });
  }
});

// Logout from a specific device (by session id)
router.post('/logout-device/:sessionId', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.userId;
    
    // Verify the session belongs to the user
    const sessions = await SessionModel.getUserSessions(userId);
    const session = sessions.find(s => s.id === parseInt(sessionId));
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    if (!session.is_active) {
      return res.status(400).json({ message: 'Session is already inactive' });
    }
    
    // Invalidate the session
    await SessionModel.invalidateSessionById(sessionId);
    
    res.json({ message: 'Device session ended successfully' });
  } catch (error) {
    console.error('Error logging out device:', error);
    res.status(500).json({ message: 'Failed to logout device', error: error.message });
  }
});

module.exports = router;
