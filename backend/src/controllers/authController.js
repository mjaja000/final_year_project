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

      // If user is a driver, fetch driver details including assigned vehicle
      if (user.role === 'driver') {
        try {
          const DriverModel = require('../models/driverModel');
          const driverDetails = await DriverModel.getDriverByUserId(userId);
          console.log('Driver details for userId', userId, ':', driverDetails);
          if (driverDetails) {
            // Merge driver details with user data
            user.assigned_vehicle_id = driverDetails.assigned_vehicle_id;
            user.vehicle_reg = driverDetails.vehicle_reg;
            user.driving_license = driverDetails.driving_license;
            user.driver_status = driverDetails.status;
            console.log('Assigned vehicle:', user.assigned_vehicle_id, 'Reg:', user.vehicle_reg);
          } else {
            console.log('No driver record found for userId', userId);
          }
        } catch (driverError) {
          console.error('Error fetching driver details:', driverError.message);
          // Continue without driver details
        }
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

  // Demo admin login: used by the demo admin UI to obtain a JWT
  static async demoLogin(req, res) {
    try {
      const DEMO_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@matatuconnect.test';
      const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'password123';
      const { email, password } = req.body;

      if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        return res.status(401).json({ message: 'Invalid demo credentials' });
      }

      // Ensure admin user exists; if not create one
      let adminUser = await UserModel.getUserByEmail(DEMO_EMAIL);
      if (!adminUser) {
        // create admin user with demo password
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
        const pool = require('../config/database');
        const insert = `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING *;`;
        const r = await pool.query(insert, ['Demo Admin', DEMO_EMAIL, hashed]);
        adminUser = r.rows[0];
      } else if (adminUser.role !== 'admin') {
        // upgrade role if necessary
        const pool = require('../config/database');
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', adminUser.id]);
      }

      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ id: adminUser.id, email: adminUser.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

      res.json({ message: 'Demo login successful', token, user: { id: adminUser.id, email: adminUser.email, role: 'admin' } });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Demo login failed', error: error.message });
    }
  }
}

module.exports = AuthController;

module.exports = AuthController;
