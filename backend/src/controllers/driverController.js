const UserModel = require('../models/userModel');
const DriverModel = require('../models/driverModel');
const ActivityLogModel = require('../models/activityLogModel');

class DriverController {
  static async createDriver(req, res) {
    try {
      let { name, email, phone, password, driving_license, assigned_vehicle_id, documents } = req.body;
      console.log('Create driver payload:', { name, email, phone, password: password ? '[REDACTED]' : undefined, driving_license, assigned_vehicle_id });
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields: name, email, password' });
      }

      // sanitize assigned vehicle id: accept number or null
      if (assigned_vehicle_id === '' || assigned_vehicle_id === undefined) assigned_vehicle_id = null;
      if (assigned_vehicle_id != null) {
        const parsed = parseInt(assigned_vehicle_id, 10);
        assigned_vehicle_id = Number.isNaN(parsed) ? null : parsed;
      }

      // Create user with driver role and generated username
      const user = await UserModel.createDriverUser({ name, email, phone, password });

      // Create driver record
      const driver = await DriverModel.createDriver({ userId: user.id, drivingLicense: driving_license, assignedVehicleId: assigned_vehicle_id, documents });

      // Log driver creation action
      try {
        await ActivityLogModel.logActivity(req.userId || null, 'driver_created', 'driver', user.id, JSON.stringify({ email: user.email, username: user.username }), req.ip || null);
      } catch (logErr) {
        console.error('Failed to log driver creation activity:', logErr);
      }

      res.status(201).json({ message: 'Driver created', user, driver });
    } catch (error) {
      console.error('Create driver error:', error.message, error.code || '');

      // Handle Postgres unique constraint violation
      if (error && error.code === '23505') {
        // extract which key caused the violation from detail or constraint
        const detail = error.detail || '';
        let field = 'field';
        if (/phone/.test(detail) || /users_phone_key/.test(error.constraint || '')) field = 'phone';
        if (/email/.test(detail) || /users_email_key/.test(error.constraint || '')) field = 'email';
        if (/username/.test(detail) || /users_username_key/.test(error.constraint || '')) field = 'username';
        return res.status(409).json({ message: `${field} already exists`, error: detail || error.message });
      }

      // Custom duplicate errors from pre-checks
      if (error && (error.code === 'DUPLICATE_EMAIL' || error.code === 'DUPLICATE_PHONE')) {
        const field = error.code === 'DUPLICATE_EMAIL' ? 'email' : 'phone';
        return res.status(409).json({ message: `${field} already exists`, error: error.message });
      }

      res.status(500).json({ message: 'Failed to create driver', error: error.message });
    }
  }

  static async listDrivers(req, res) {
    try {
      const drivers = await DriverModel.getAllDrivers();
      res.json({ total: drivers.length, drivers });
    } catch (error) {
      console.error('List drivers error:', error.message);
      res.status(500).json({ message: 'Failed to list drivers', error: error.message });
    }
  }

  // Public, read-only list of drivers (no auth)
  static async listDriversPublic(req, res) {
    try {
      const drivers = await DriverModel.getAllDrivers();
      // Return a minimal, non-sensitive view
      const publicDrivers = drivers.map((driver) => ({
        id: driver.id,
        user_id: driver.user_id,
        username: driver.username,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle_reg: driver.vehicle_reg,
        driving_license: driver.driving_license,
        status: driver.status,
      }));
      res.json({ total: publicDrivers.length, drivers: publicDrivers });
    } catch (error) {
      console.error('List public drivers error:', error.message);
      res.status(500).json({ message: 'Failed to list drivers', error: error.message });
    }
  }

  // Admin: fetch recent password reset activities
  static async getResetLogs(req, res) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const activities = await ActivityLogModel.getActivitiesByActionType('driver_password_reset', limit);
      res.json({ count: activities.length, activities });
    } catch (error) {
      console.error('Get reset logs error:', error.message);
      res.status(500).json({ message: 'Failed to fetch reset logs', error: error.message });
    }
  }

  // Driver: get the active trip for the logged in driver
  static async getMyActiveTrip(req, res) {
    try {
      const userId = req.userId;
      const driver = await require('../models/driverModel').getDriverByUserId(userId);
      if (!driver || !driver.assigned_vehicle_id) return res.status(404).json({ message: 'No vehicle assigned' });
      const vehicleId = driver.assigned_vehicle_id;
      const TripModel = require('../models/tripModel');
      // find trip with this vehicle that is not completed (most recent)
      const trips = await TripModel.getAvailableTrips();
      const myTrip = trips.find(t => t.vehicle_id === vehicleId || t.vehicle_id === Number(vehicleId));
      if (!myTrip) return res.status(404).json({ message: 'No active trip for your vehicle' });
      res.json({ trip: myTrip });
    } catch (error) {
      console.error('Get my active trip error:', error.message);
      res.status(500).json({ message: 'Failed to fetch active trip', error: error.message });
    }
  }

  static async getBookingsForMyTrip(req, res) {
    try {
      const userId = req.userId;
      const driver = await require('../models/driverModel').getDriverByUserId(userId);
      if (!driver || !driver.assigned_vehicle_id) return res.status(404).json({ message: 'No vehicle assigned' });
      const TripModel = require('../models/tripModel');
      const trips = await TripModel.getAvailableTrips();
      const myTrip = trips.find(t => t.vehicle_id === driver.assigned_vehicle_id || t.vehicle_id === Number(driver.assigned_vehicle_id));
      if (!myTrip) return res.status(404).json({ message: 'No active trip for your vehicle' });
      const BookingModel = require('../models/bookingModel');
      const bookings = await BookingModel.getBookingsByTrip(myTrip.id);
      res.json({ trip: myTrip, bookings });
    } catch (error) {
      console.error('Get bookings for my trip error:', error.message);
      res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
    }
  }

  // Driver: adjust numeric occupancy on the trip (increment/decrement)
  static async adjustOccupancy(req, res) {
    try {
      const userId = req.userId;
      const { tripId } = req.params;
      const { action } = req.body; // 'increment' | 'decrement' | 'set'
      if (!tripId || !action) return res.status(400).json({ message: 'Missing tripId or action' });

      const TripModel = require('../models/tripModel');
      let trip;
      if (action === 'increment') trip = await TripModel.incrementOccupancy(tripId);
      else if (action === 'decrement') trip = await TripModel.decrementOccupancy(tripId);
      else if (action === 'set') {
        const { value } = req.body;
        if (value === undefined || value === null) return res.status(400).json({ message: 'Missing value for set action' });
        // Since there's no direct set in TripModel, use OccupancyModel update (or TripModel updateStatus + manual query)
        const pool = require('../config/database');
        const q = `UPDATE trips SET current_occupancy = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
        const r = await pool.query(q, [Number(value), tripId]);
        trip = r.rows[0];
      } else return res.status(400).json({ message: 'Invalid action' });

      // emit socket event to admin and driver rooms
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('trip.occupancyUpdated', trip);
        io.to(`vehicle_${trip.vehicle_id}`).emit('trip.occupancyUpdated', trip);
      }

      res.json({ message: 'Occupancy adjusted', trip });
    } catch (error) {
      console.error('Adjust occupancy error:', error.message);
      res.status(500).json({ message: 'Failed to adjust occupancy', error: error.message });
    }
  }

  static async assignVehicle(req, res) {
    try {
      const { userId, vehicleId } = req.body;
      if (!userId || !vehicleId) return res.status(400).json({ message: 'Missing userId or vehicleId' });
      const updated = await DriverModel.assignVehicle(userId, vehicleId);
      res.json({ message: 'Vehicle assigned', driver: updated });
    } catch (error) {
      console.error('Assign vehicle error:', error.message);
      res.status(500).json({ message: 'Failed to assign vehicle', error: error.message });
    }
  }

  static async updateDriver(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });

      let { name, phone, driving_license, assigned_vehicle_id } = req.body;

      // sanitize assigned vehicle id
      if (assigned_vehicle_id === '' || assigned_vehicle_id === undefined) assigned_vehicle_id = null;
      if (assigned_vehicle_id != null) {
        const parsed = parseInt(assigned_vehicle_id, 10);
        assigned_vehicle_id = Number.isNaN(parsed) ? null : parsed;
      }

      // Update user basic info
      let updatedUser = null;
      if (name || phone) {
        updatedUser = await UserModel.updateUser(userId, name || undefined, phone || undefined, undefined);
      }

      // Update driver-specific fields
      const updatedDriver = await DriverModel.updateDriver(userId, { drivingLicense: driving_license, assignedVehicleId: assigned_vehicle_id });

      res.json({ message: 'Driver updated', user: updatedUser, driver: updatedDriver });
    } catch (error) {
      console.error('Update driver error:', error.message);
      res.status(500).json({ message: 'Failed to update driver', error: error.message });
    }
  }

  static async deleteDriver(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });

      const deleted = await UserModel.deleteUser(userId);
      if (!deleted) return res.status(404).json({ message: 'User not found' });

      res.json({ message: 'Driver deleted', user: deleted });
    } catch (error) {
      console.error('Delete driver error:', error.message);
      res.status(500).json({ message: 'Failed to delete driver', error: error.message });
    }
  }

  // Reset driver's password (admin action) - generate a temporary password and set it
  static async resetPassword(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });

      // ensure driver exists
      const driver = await DriverModel.getDriverByUserId(userId);
      if (!driver) return res.status(404).json({ message: 'Driver not found' });

      // Generate a temporary password
      const tempPass = 'Drv@' + Math.random().toString(36).slice(2, 10);

      // Update password via UserModel
      await UserModel.changePassword(userId, tempPass);

      // Log the reset activity (do not store the full password)
      try {
        const masked = '****' + String(tempPass).slice(-2);
        await ActivityLogModel.logActivity(req.userId || null, 'driver_password_reset', 'driver', userId, JSON.stringify({ masked }), req.ip || null);
      } catch (logErr) {
        console.error('Failed to log password reset activity:', logErr);
      }

      res.json({ message: 'Password reset', password: tempPass });
    } catch (error) {
      console.error('Reset password error:', error.message);
      res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
  }
}



module.exports = DriverController;
