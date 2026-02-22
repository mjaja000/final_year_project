const RouteModel = require('../models/routeModel');

class RouteController {
  static async getAll(req, res) {
    try {
      const routes = await RouteModel.getAllRoutes();
      res.json({ message: 'Routes fetched', total: routes.length, routes });
    } catch (error) {
      console.error('Get routes error:', error);
      res.status(500).json({ message: 'Failed to fetch routes', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const route = await RouteModel.getRouteById(req.params.id);
      if (!route) return res.status(404).json({ message: 'Route not found' });
      res.json({ message: 'Route fetched', route });
    } catch (error) {
      console.error('Get route error:', error);
      res.status(500).json({ message: 'Failed to fetch route', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { 
        route_name, routeName, 
        start_location, startLocation, 
        end_location, endLocation, 
        base_fare, baseFare, 
        start_latitude, startLatitude, 
        start_longitude, startLongitude, 
        end_latitude, endLatitude, 
        end_longitude, endLongitude, 
        description 
      } = req.body;
      
      const name = route_name || routeName;
      const start = start_location || startLocation;
      const end = end_location || endLocation;
      const fare = base_fare || baseFare;
      const startLat = start_latitude || startLatitude;
      const startLng = start_longitude || startLongitude;
      const endLat = end_latitude || endLatitude;
      const endLng = end_longitude || endLongitude;

      if (!name || !start || !end || fare === undefined) {
        return res.status(400).json({ message: 'Missing required fields: route_name, start_location, end_location, base_fare' });
      }

      const route = await RouteModel.createRoute(name, start, end, fare, startLat, startLng, endLat, endLng, description);
      res.status(201).json({ message: 'Route created', route });
    } catch (error) {
      console.error('Create route error:', error);
      res.status(500).json({ message: 'Failed to create route', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const updated = await RouteModel.updateRoute(req.params.id, req.body || {});
      if (!updated) return res.status(404).json({ message: 'Route not found' });
      res.json({ message: 'Route updated', route: updated });
    } catch (error) {
      console.error('Update route error:', error);
      res.status(500).json({ message: 'Failed to update route', error: error.message });
    }
  }

  static async remove(req, res) {
    try {
      const deleted = await RouteModel.deleteRoute(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Route not found' });
      res.json({ message: 'Route deleted', route: deleted });
    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ message: 'Failed to delete route', error: error.message });
    }
  }
}

module.exports = RouteController;
