const UserModel = require('../models/userModel');
const DriverModel = require('../models/driverModel');

class DriverController {
  static async createDriver(req, res) {
    try {
      const { name, email, phone, password, driving_license, assigned_vehicle_id, documents } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields: name, email, password' });
      }

      // Create user with driver role and generated username
      const user = await UserModel.createDriverUser({ name, email, phone, password });

      // Create driver record
      const driver = await DriverModel.createDriver({ userId: user.id, drivingLicense: driving_license, assignedVehicleId: assigned_vehicle_id, documents });

      res.status(201).json({ message: 'Driver created', user, driver });
    } catch (error) {
      console.error('Create driver error:', error.message);
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
}

module.exports = DriverController;
