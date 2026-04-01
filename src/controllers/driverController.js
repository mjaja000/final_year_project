const UserModel = require('../models/userModel');
const DriverModel = require('../models/driverModel');
const ActivityLogModel = require('../models/activityLogModel');
const VehicleModel = require('../models/vehicleModel');

class DriverController {
  static async getDriverAssignmentStatus(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });

      const driver = await DriverModel.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const hasVehicleAssigned = Boolean(driver.assigned_vehicle_id);

      return res.json({
        message: 'Driver assignment status fetched',
        assignment: {
          user_id: driver.user_id,
          driver_id: driver.id,
          driver_name: driver.name,
          driver_email: driver.email,
          assigned_vehicle_id: driver.assigned_vehicle_id || null,
          vehicle_registration: driver.vehicle_reg || null,
          route_id: driver.route_id || null,
          route_name: driver.route_name || null,
          start_location: driver.start_location || null,
          end_location: driver.end_location || null,
          has_vehicle_assigned: hasVehicleAssigned,
        },
      });
    } catch (error) {
      console.error('Get driver assignment status error:', error.message);
      return res.status(500).json({ message: 'Failed to fetch driver assignment status', error: error.message });
    }
  }

  // Resolves the driver's currently assigned vehicle and best matching active trip.
  static async getAssignedDriverAndTrip(userId) {
    const driver = await DriverModel.getDriverByUserId(userId);
    if (!driver || !driver.assigned_vehicle_id) {
      return { driver, trip: null };
    }

    const TripModel = require('../models/tripModel');
    const trips = await TripModel.getAvailableTrips();
    const matchedTrips = trips.filter(
      (t) => Number(t.vehicle_id) === Number(driver.assigned_vehicle_id)
    );

    if (!matchedTrips.length) {
      return { driver, trip: null };
    }

    matchedTrips.sort((a, b) => {
      const aTime = new Date(a.updated_at || a.start_time || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.start_time || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    return { driver, trip: matchedTrips[0] };
  }

  static async applyTripOccupancyAction({ tripId, action, value }) {
    const TripModel = require('../models/tripModel');

    if (action === 'increment') {
      const currentTrip = await TripModel.getTripById(tripId);
      if (!currentTrip) return { error: 'Trip not found', status: 404 };
      const capacity = Number(currentTrip.capacity || 14);
      const current = Number(currentTrip.current_occupancy || 0);
      if (current >= capacity) {
        return { error: 'Trip is already full', status: 400 };
      }
      const trip = await TripModel.incrementOccupancy(tripId);
      return { trip };
    }

    if (action === 'decrement') {
      const currentTrip = await TripModel.getTripById(tripId);
      if (!currentTrip) return { error: 'Trip not found', status: 404 };
      const current = Number(currentTrip.current_occupancy || 0);
      if (current <= 0) {
        return { error: 'Occupancy is already zero', status: 400 };
      }
      const trip = await TripModel.decrementOccupancy(tripId);
      return { trip };
    }

    if (action === 'set') {
      if (value === undefined || value === null || Number.isNaN(Number(value))) {
        return { error: 'Missing value for set action', status: 400 };
      }

      const currentTrip = await TripModel.getTripById(tripId);
      if (!currentTrip) return { error: 'Trip not found', status: 404 };

      const capacity = Number(currentTrip.capacity || 14);
      const numericValue = Math.max(0, Math.min(capacity, Number(value)));
      const pool = require('../config/database');
      const q = `UPDATE trips SET current_occupancy = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *;`;
      const r = await pool.query(q, [numericValue, tripId]);
      return { trip: r.rows[0] };
    }

    return { error: 'Invalid action', status: 400 };
  }

  static async createDriver(req, res) {
    try {
      let { name, email, phone, password, driving_license, assigned_vehicle_id, documents } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields: name, email, password' });
      }

      // sanitize assigned vehicle id: accept number or null
      if (assigned_vehicle_id === '' || assigned_vehicle_id === undefined) assigned_vehicle_id = null;
      if (assigned_vehicle_id != null) {
        const parsed = parseInt(assigned_vehicle_id, 10);
        assigned_vehicle_id = Number.isNaN(parsed) ? null : parsed;

        if (assigned_vehicle_id) {
          const existingAssignment = await DriverModel.getDriverByVehicleId(assigned_vehicle_id);
          if (existingAssignment) {
            return res.status(409).json({
              message: `Vehicle is already assigned to ${existingAssignment.username || existingAssignment.name || 'another driver'}`,
            });
          }
        }
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
        if (/assigned_vehicle_id/.test(detail) || /drivers_assigned_vehicle_unique_idx/.test(error.constraint || '')) field = 'assigned vehicle';
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
        profile_image: driver.profile_image || null,
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

      const { driver, trip: assignedTrip } = await DriverController.getAssignedDriverAndTrip(userId);
      if (!driver || !driver.assigned_vehicle_id) {
        return res.status(404).json({ message: 'No vehicle assigned' });
      }

      const TripModel = require('../models/tripModel');
      const requestedTrip = await TripModel.getTripById(tripId);
      if (!requestedTrip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      if (Number(requestedTrip.vehicle_id) !== Number(driver.assigned_vehicle_id)) {
        return res.status(403).json({ message: 'You can only update occupancy for your assigned vehicle' });
      }

      if (assignedTrip && Number(assignedTrip.id) !== Number(requestedTrip.id)) {
        return res.status(409).json({ message: 'Use your active assigned trip for occupancy updates' });
      }

      const result = await DriverController.applyTripOccupancyAction({
        tripId,
        action,
        value: req.body?.value,
      });

      if (result.error) {
        return res.status(result.status || 400).json({ message: result.error });
      }

      const trip = result.trip;

      const OccupancyModel = require('../models/occupancyModel');
      const capacity = Number(trip.capacity || 14);
      await OccupancyModel.updateOccupancyCount(
        trip.vehicle_id,
        userId,
        Number(trip.current_occupancy || 0),
        capacity
      );

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

  // Driver: update occupancy for active trip of assigned vehicle only
  static async updateMyAssignedVehicleOccupancy(req, res) {
    try {
      const userId = req.userId;
      const { action, value } = req.body;

      if (!action) {
        return res.status(400).json({ message: 'Missing action' });
      }

      const { driver, trip } = await DriverController.getAssignedDriverAndTrip(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      if (!driver.assigned_vehicle_id) {
        return res.status(404).json({ message: 'No vehicle assigned' });
      }
      const OccupancyModel = require('../models/occupancyModel');
      const vehicle = await VehicleModel.getVehicleById(driver.assigned_vehicle_id);
      if (!vehicle) {
        return res.status(404).json({ message: 'Assigned vehicle not found' });
      }

      const capacity = Number(vehicle.capacity || trip?.capacity || 14);
      const occupancyRecord = await OccupancyModel.getOccupancyStatus(driver.assigned_vehicle_id);

      let updatedTrip = null;
      let nextOccupancy = Number(occupancyRecord?.current_occupancy || trip?.current_occupancy || 0);

      if (trip) {
        const result = await DriverController.applyTripOccupancyAction({
          tripId: trip.id,
          action,
          value,
        });

        if (result.error) {
          return res.status(result.status || 400).json({ message: result.error });
        }

        updatedTrip = result.trip;
        nextOccupancy = Number(updatedTrip.current_occupancy || 0);
      } else {
        if (action === 'increment') {
          if (nextOccupancy >= capacity) {
            return res.status(400).json({ message: 'Vehicle is already full' });
          }
          nextOccupancy += 1;
        } else if (action === 'decrement') {
          if (nextOccupancy <= 0) {
            return res.status(400).json({ message: 'Occupancy is already zero' });
          }
          nextOccupancy -= 1;
        } else if (action === 'set') {
          if (value === undefined || value === null || Number.isNaN(Number(value))) {
            return res.status(400).json({ message: 'Missing value for set action' });
          }
          nextOccupancy = Math.max(0, Math.min(capacity, Number(value)));
        } else {
          return res.status(400).json({ message: 'Invalid action' });
        }
      }

      const updatedOccupancy = await OccupancyModel.updateOccupancyCount(
        driver.assigned_vehicle_id,
        userId,
        nextOccupancy,
        capacity
      );

      const io = req.app.get('io');
      if (io) {
        if (updatedTrip) {
          io.to('admin').emit('trip.occupancyUpdated', updatedTrip);
          io.to(`vehicle_${updatedTrip.vehicle_id}`).emit('trip.occupancyUpdated', updatedTrip);
        }
        io.to('admin').emit('vehicle.occupancyUpdated', {
          vehicle_id: driver.assigned_vehicle_id,
          current_occupancy: updatedOccupancy.current_occupancy,
          occupancy_status: updatedOccupancy.occupancy_status,
          capacity,
        });
      }

      res.json({
        message: 'Occupancy updated for assigned vehicle',
        trip: updatedTrip,
        occupancy: {
          ...updatedOccupancy,
          capacity,
        },
        vehicleId: driver.assigned_vehicle_id,
      });
    } catch (error) {
      console.error('Update assigned occupancy error:', error.message);
      res.status(500).json({ message: 'Failed to update occupancy', error: error.message });
    }
  }

  // Driver: get occupancy context for assigned vehicle
  static async getMyAssignedVehicleOccupancy(req, res) {
    try {
      const userId = req.userId;
      const { driver, trip } = await DriverController.getAssignedDriverAndTrip(userId);

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      if (!driver.assigned_vehicle_id) {
        return res.status(404).json({ message: 'No vehicle assigned' });
      }

      const OccupancyModel = require('../models/occupancyModel');
      const occupancy = await OccupancyModel.getOccupancyStatus(driver.assigned_vehicle_id);
      const vehicle = await VehicleModel.getVehicleById(driver.assigned_vehicle_id);
      const capacity = Number(vehicle?.capacity || trip?.capacity || 14);
      const currentOccupancy = Number(occupancy?.current_occupancy || trip?.current_occupancy || 0);

      res.json({
        message: 'Assigned vehicle occupancy fetched',
        vehicleId: driver.assigned_vehicle_id,
        trip: trip || null,
        occupancy: {
          ...(occupancy || {}),
          current_occupancy: currentOccupancy,
          capacity,
          occupancy_status: currentOccupancy >= capacity ? 'full' : 'available',
        },
      });
    } catch (error) {
      console.error('Get assigned occupancy error:', error.message);
      res.status(500).json({ message: 'Failed to fetch occupancy', error: error.message });
    }
  }

  static async assignVehicle(req, res) {
    try {
      const { userId, vehicleId } = req.body;
      if (!userId || !vehicleId) return res.status(400).json({ message: 'Missing userId or vehicleId' });

      // Application-level check for friendlier error messaging before DB constraint enforcement.
      const existingAssignment = await DriverModel.getDriverByVehicleId(vehicleId);
      if (existingAssignment && Number(existingAssignment.user_id) !== Number(userId)) {
        return res.status(409).json({
          message: `Vehicle is already assigned to ${existingAssignment.username || existingAssignment.name || 'another driver'}`,
        });
      }

      const updated = await DriverModel.assignVehicle(userId, vehicleId);
      res.json({ message: 'Vehicle assigned', driver: updated });
    } catch (error) {
      console.error('Assign vehicle error:', error.message);
      if (error && error.code === '23505' && /drivers_assigned_vehicle_unique_idx|assigned_vehicle_id/i.test(error.constraint || error.detail || '')) {
        return res.status(409).json({ message: 'Vehicle is already assigned to another driver' });
      }
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
      const driverUpdate = {};
      if (driving_license !== undefined) driverUpdate.drivingLicense = driving_license;
      if (assigned_vehicle_id !== undefined) driverUpdate.assignedVehicleId = assigned_vehicle_id;

      if (assigned_vehicle_id) {
        const existingAssignment = await DriverModel.getDriverByVehicleId(assigned_vehicle_id);
        if (existingAssignment && Number(existingAssignment.user_id) !== Number(userId)) {
          return res.status(409).json({
            message: `Vehicle is already assigned to ${existingAssignment.username || existingAssignment.name || 'another driver'}`,
          });
        }
      }

      const updatedDriver = await DriverModel.updateDriver(userId, driverUpdate);

      res.json({ message: 'Driver updated', user: updatedUser, driver: updatedDriver });
    } catch (error) {
      console.error('Update driver error:', error.message);
      if (error && error.code === '23505' && /drivers_assigned_vehicle_unique_idx|assigned_vehicle_id/i.test(error.constraint || error.detail || '')) {
        return res.status(409).json({ message: 'Vehicle is already assigned to another driver' });
      }
      res.status(500).json({ message: 'Failed to update driver', error: error.message });
    }
  }

  static async uploadDriverPhoto(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });
      if (!req.file) return res.status(400).json({ message: 'Photo file is required' });

      const profileImagePath = `/uploads/drivers/${req.file.filename}`;
      const updatedUser = await UserModel.updateProfileImage(userId, profileImagePath);
      if (!updatedUser) return res.status(404).json({ message: 'Driver user not found' });

      res.json({
        message: 'Driver photo uploaded',
        user: updatedUser,
        profile_image: updatedUser.profile_image,
      });
    } catch (error) {
      console.error('Upload driver photo error:', error.message);
      res.status(500).json({ message: 'Failed to upload driver photo', error: error.message });
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

  // Reset driver's password; supports admin-supplied password or generated temporary password.
  static async resetPassword(req, res) {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ message: 'Invalid userId' });

      const providedPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
      if (providedPassword && providedPassword.length < 8) {
        return res.status(400).json({ message: 'Manual password must be at least 8 characters' });
      }

      // ensure driver exists
      const driver = await DriverModel.getDriverByUserId(userId);
      if (!driver) return res.status(404).json({ message: 'Driver not found' });

      // Generate a temporary password
      const tempPass = providedPassword || ('Drv@' + Math.random().toString(36).slice(2, 10));

      // Update password via UserModel
      await UserModel.changePassword(userId, tempPass);

      // Log the reset activity (do not store the full password)
      try {
        const masked = '****' + String(tempPass).slice(-2);
        await ActivityLogModel.logActivity(
          req.userId || null,
          'driver_password_reset',
          'driver',
          userId,
          JSON.stringify({ masked, mode: providedPassword ? 'manual' : 'generated' }),
          req.ip || null
        );
      } catch (logErr) {
        console.error('Failed to log password reset activity:', logErr);
      }

      res.json({ message: 'Password reset', password: tempPass, mode: providedPassword ? 'manual' : 'generated' });
    } catch (error) {
      console.error('Reset password error:', error.message);
      res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
  }

  // Driver: Get all tickets/payments for their assigned vehicle
  static async getMyVehicleTickets(req, res) {
    try {
      const userId = req.userId;
      const driver = await DriverModel.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      if (!driver.assigned_vehicle_id) {
        return res.json({ message: 'No vehicle assigned', tickets: [] });
      }

      // Fetch all completed payments for this vehicle
      const pool = require('../config/database');
      
      const query = `
        SELECT p.*, r.route_name, v.registration_number as vehicle_number
        FROM payments p
        LEFT JOIN routes r ON p.route_id = r.id
        LEFT JOIN vehicles v ON p.vehicle_id = v.id
        WHERE p.status = 'completed'
          AND (
            p.vehicle_id = $1
            OR UPPER(REPLACE(REPLACE(v.registration_number, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE($2, '-', ''), ' ', ''))
          )
        ORDER BY p.created_at DESC
        LIMIT 100
      `;

      const result = await pool.query(query, [driver.assigned_vehicle_id, driver.vehicle_reg || '']);

      res.json({ 
        message: 'Vehicle tickets fetched',
        tickets: result.rows,
        vehicle: {
          id: driver.assigned_vehicle_id,
          registration: driver.vehicle_reg
        }
      });
    } catch (error) {
      console.error('Get vehicle tickets error:', error.message);
      res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
    }
  }

  // Driver: Add passenger with payment tracking
  static async addPassengerPayment(req, res) {
    try {
      const userId = req.userId;
      const { routeId, phoneNumber, amount, paymentMethod, vehicleId } = req.body;

      // Validate input
      if (!routeId || !phoneNumber || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate phone number
      const { validatePhoneOrThrow, normalizeKenyanPhone } = require('../utils/phoneValidation');
      try {
        validatePhoneOrThrow(phoneNumber);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }

      const normalizedPhone = normalizeKenyanPhone(phoneNumber);

      // Get driver and trip
      const { driver, trip } = await DriverController.getAssignedDriverAndTrip(userId);
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }

      const finalVehicleId = vehicleId || driver.assigned_vehicle_id;
      if (!finalVehicleId) {
        return res.status(400).json({ message: 'No vehicle assigned' });
      }

      const PaymentModel = require('../models/paymentModel');
      
      // Create payment record
      const transactionId = `DRV-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
      const pool = require('../config/database');
      
      const insertQuery = `
        INSERT INTO payments (
          user_id, route_id, vehicle_id, amount, phone_number, 
          status, payment_method, transaction_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      
      const result = await pool.query(insertQuery, [
        null, // user_id can be null for driver-initiated payments
        routeId,
        finalVehicleId,
        amount,
        normalizedPhone,
        'completed', // Driver records are pre-completed
        paymentMethod || 'cash',
        transactionId
      ]);

      const payment = result.rows[0];

      // Increment occupancy
      let updatedTrip = null;

      if (trip) {
        const TripModel = require('../models/tripModel');
        updatedTrip = await TripModel.incrementOccupancy(trip.id);
      }

      // Also update occupancy table — atomically enforces capacity cap
      const OccupancyModel = require('../models/occupancyModel');
      const { updated: occupancyUpdated, row: occupancyRow } = await OccupancyModel.incrementOccupancy(finalVehicleId);
      const occupancy = occupancyRow;

      if (!occupancyUpdated) {
        return res.status(409).json({
          message: 'Vehicle is already full. No more passengers can be added.',
          occupancy: occupancyRow,
        });
      }

      // Send WhatsApp confirmation if available
      try {
        const RouteModel = require('../models/routeModel');
        const route = await RouteModel.getRouteById(routeId);
        
        const whatsappService = require('../services/whatsappService');
        const message = `Payment confirmed! Route: ${route?.route_name || 'N/A'}, Amount: KSh ${amount}, Transaction: ${transactionId}. Thank you for traveling with us!`;
        
        await whatsappService.sendMessage(normalizedPhone, message);
      } catch (whatsappErr) {
        console.error('WhatsApp notification failed:', whatsappErr.message);
        // Don't fail the whole request if WhatsApp fails
      }

      // Emit socket event to admin and driver so UI updates in real-time
      try {
        const io = req.app.get('io');
        if (io) {
          const occupancyPayload = {
            vehicle_id: finalVehicleId,
            current_occupancy: occupancy?.current_occupancy || 0,
            occupancy_status: occupancy?.occupancy_status || 'available',
            capacity: occupancy?.capacity || 14,
          };
          io.to('admin').emit('vehicle.occupancyUpdated', occupancyPayload);
          io.to(`user_${userId}`).emit('vehicle.occupancyUpdated', occupancyPayload);
        }
      } catch (ioErr) {
        console.error('Socket emission failed:', ioErr.message);
      }

      res.json({
        message: 'Payment recorded and passenger added',
        payment,
        trip: updatedTrip || trip,
        occupancy,
        transactionId
      });

    } catch (error) {
      console.error('Add passenger payment error:', error.message);
      res.status(500).json({ message: 'Failed to record payment', error: error.message });
    }
  }
}



module.exports = DriverController;
