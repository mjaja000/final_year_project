const OccupancyModel = require('../models/occupancyModel');
const VehicleModel = require('../models/vehicleModel');
const RouteModel = require('../models/routeModel');

class OccupancyController {
  // Update vehicle occupancy status (FR3: driver interface to mark "Seats Available" or "Full")
  static async updateOccupancyStatus(req, res) {
    try {
      const userId = req.userId;
      const { vehicleId, status } = req.body;

      // Validate required fields
      if (!vehicleId || !status) {
        return res.status(400).json({ 
          message: 'Missing required fields: vehicleId, status' 
        });
      }

      // Validate status (must be 'available' or 'full')
      if (!['available', 'full'].includes(status.toLowerCase())) {
        return res.status(400).json({ 
          message: 'Status must be either "available" or "full"' 
        });
      }

      // Verify vehicle belongs to user (driver)
      const vehicle = await VehicleModel.getVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Update occupancy status
      const occupancy = await OccupancyModel.updateOccupancyStatus(
        vehicleId, 
        userId, 
        status.toLowerCase()
      );

      res.json({
        message: 'Vehicle occupancy status updated successfully',
        occupancy,
      });
    } catch (error) {
      console.error('Update occupancy error:', error);
      res.status(500).json({ message: 'Failed to update occupancy status', error: error.message });
    }
  }

  // Get vehicle occupancy status
  static async getOccupancyStatus(req, res) {
    try {
      const { vehicleId } = req.params;

      const occupancy = await OccupancyModel.getOccupancyStatus(vehicleId);
      
      if (!occupancy) {
        return res.status(404).json({ message: 'Occupancy status not found' });
      }

      res.json({
        message: 'Vehicle occupancy status fetched',
        occupancy,
      });
    } catch (error) {
      console.error('Get occupancy error:', error);
      res.status(500).json({ message: 'Failed to fetch occupancy status', error: error.message });
    }
  }

  // Public: update numeric occupancy for a vehicle (used by frontend PUT /api/occupancy/:vehicleId)
  static async updateOccupancyCount(req, res) {
    try {
      const { vehicleId } = req.params;
      const { current_occupancy } = req.body;

      if (current_occupancy === undefined || current_occupancy === null) {
        return res.status(400).json({ message: 'Missing required field: current_occupancy' });
      }

      const vehicle = await VehicleModel.getVehicleById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      const capacity = vehicle.capacity || 14;
      const driverId = vehicle.user_id || null;
      const occupancy = await OccupancyModel.updateOccupancyCount(vehicleId, driverId, Number(current_occupancy), capacity);

      res.json({
        message: 'Vehicle occupancy updated',
        occupancy,
      });
    } catch (error) {
      console.error('Update occupancy count error:', error);
      res.status(500).json({ message: 'Failed to update occupancy', error: error.message });
    }
  }

  // Get all vehicle occupancy statuses
  static async getAllOccupancyStatuses(req, res) {
    try {
      const occupancies = await OccupancyModel.getAllOccupancyStatuses();

      res.json({
        message: 'All vehicle occupancy statuses fetched',
        total: occupancies.length,
        occupancies,
      });
    } catch (error) {
      console.error('Get all occupancy error:', error);
      res.status(500).json({ message: 'Failed to fetch occupancy statuses', error: error.message });
    }
  }

  // Get all available routes
  static async getAllRoutes(req, res) {
    try {
      const routes = await RouteModel.getAllRoutes();
      
      res.json({
        message: 'All routes fetched successfully',
        routes: routes.map(route => ({
          id: route.id,
          routeName: route.route_name,
          startLocation: route.start_location,
          endLocation: route.end_location,
          baseFare: route.base_fare,
          description: route.description,
          status: route.status
        }))
      });
    } catch (error) {
      console.error('Get all routes error:', error);
      res.status(500).json({ message: 'Failed to fetch routes', error: error.message });
    }
  }

  // Delete occupancy status for a vehicle
  static async deleteOccupancy(req, res) {
    try {
      const { vehicleId } = req.params;
      const deleted = await OccupancyModel.deleteOccupancy(vehicleId);

      if (!deleted) {
        return res.status(404).json({ message: 'Occupancy status not found' });
      }

      res.json({
        message: 'Occupancy status deleted',
        occupancy: deleted,
      });
    } catch (error) {
      console.error('Delete occupancy error:', error);
      res.status(500).json({ message: 'Failed to delete occupancy status', error: error.message });
    }
  }
}

module.exports = OccupancyController;
