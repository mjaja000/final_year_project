const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

class AuthController {
  // Register
  static async register(req, res) {
    try {
      const { name, email, phone, password, confirmPassword } = req.body;

      // Validation
      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Check if user exists
      const existingUser = await UserModel.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // Register user
      const user = await UserModel.register(name, email, phone, password);

      res.status(201).json({
        message: 'User registered successfully',
        user,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Get user by email or username
      const user = await UserModel.getUserByIdentifier(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isPasswordValid = await UserModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }

  // Get profile
  static async getProfile(req, res) {
    try {
      const userId = req.userId;
      const user = await UserModel.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Profile fetched', user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
  }

  // Update profile
  static async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { name, phone } = req.body;
      const profileImage = req.file ? req.file.path : null;

      const updatedUser = await UserModel.updateUser(userId, name, phone, profileImage);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Get user and verify current password
      const user = await UserModel.getUserByEmail(req.userEmail);
      const isPasswordValid = await UserModel.verifyPassword(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      await UserModel.changePassword(userId, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      // Token invalidation is typically handled client-side
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Logout failed', error: error.message });
    }
  }
}

module.exports = AuthController;
