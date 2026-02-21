const jwt = require('jsonwebtoken');
const SessionModel = require('../models/sessionModel');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session is still active (prevents multi-device login)
    const isTokenActive = await SessionModel.isTokenActive(token);
    if (!isTokenActive) {
      return res.status(401).json({ 
        message: 'Session expired or logged in from another device. Please log in again.',
        reason: 'SESSION_INVALIDATED'
      });
    }

    // Update last activity
    await SessionModel.updateLastActivity(token);

    // Attach user info to request
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    req.token = token;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

const authorizeRoles = (allowedRoles) => (req, res, next) => {
  try {
    // Convert single role string to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization check failed', error: error.message });
  }
};

const authenticateToken = authMiddleware;

module.exports = { authMiddleware, authorizeRoles, authenticateToken };
