const VehicleModel = require('../models/vehicleModel');

class VehicleController {
  static async getAll(req, res) {
    try {
      const vehicles = await VehicleModel.getAllVehicles();
      res.json({ message: 'Vehicles fetched', total: vehicles.length, vehicles });
    } catch (error) {
      console.error('Get vehicles error:', error);
      res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const vehicle = await VehicleModel.getVehicleById(req.params.id);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      res.json({ message: 'Vehicle fetched', vehicle });
    } catch (error) {
      console.error('Get vehicle error:', error);
      res.status(500).json({ message: 'Failed to fetch vehicle', error: error.message });
    }
  }

  static async getByRoute(req, res) {
    try {
      const vehicles = await VehicleModel.getVehiclesByRoute(req.params.routeId);
      res.json({ message: 'Vehicles fetched', total: vehicles.length, vehicles });
    } catch (error) {
      console.error('Get vehicles by route error:', error);
      res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { registration_number, registrationNumber, vehicle_type, vehicleType, color, make, model, year, route_id, routeId, capacity, user_id, userId } = req.body;
      const reg = registration_number || registrationNumber;
      if (!reg) return res.status(400).json({ message: 'registration_number is required' });

      const vehicle = await VehicleModel.addVehicle({
        userId: user_id || userId || null,
        registrationNumber: reg,
        vehicleType: vehicle_type || vehicleType,
        color,
        make,
        model,
        year,
        routeId: route_id || routeId || null,
        capacity: capacity || 14,
      });

      res.status(201).json({ message: 'Vehicle created', vehicle });
    } catch (error) {
      console.error('Create vehicle error:', error);
      res.status(500).json({ message: 'Failed to create vehicle', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await VehicleModel.updateVehicle(req.params.id, {
        vehicleType: req.body.vehicle_type || req.body.vehicleType,
        color: req.body.color,
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        routeId: req.body.route_id || req.body.routeId,
        capacity: req.body.capacity,
      });

      if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
      res.json({ message: 'Vehicle updated', vehicle: updated });
    } catch (error) {
      console.error('Update vehicle error:', error);
      res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await VehicleModel.deleteVehicle(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Vehicle not found' });
      res.json({ message: 'Vehicle deleted', vehicle: deleted });
    } catch (error) {
      console.error('Delete vehicle error:', error);
      res.status(500).json({ message: 'Failed to delete vehicle', error: error.message });
    }
  }
}

module.exports = VehicleController;
