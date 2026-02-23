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
        route_name, 
        start_location, 
        end_location, 
        base_fare, 
        distance_km,
        start_latitude, 
        start_longitude, 
        end_latitude, 
        end_longitude, 
        description 
      } = req.body;

      if (!route_name || !start_location || !end_location || base_fare === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Parse coordinates to numbers if they exist
      const startLat = start_latitude ? parseFloat(start_latitude) : null;
      const startLng = start_longitude ? parseFloat(start_longitude) : null;
      const endLat = end_latitude ? parseFloat(end_latitude) : null;
      const endLng = end_longitude ? parseFloat(end_longitude) : null;

      const route = await RouteModel.createRoute(
        route_name, 
        start_location, 
        end_location, 
        base_fare, 
        startLat,
        startLng,
        endLat,
        endLng,
        description
      );
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
      const result = await RouteModel.deleteRoute(req.params.id);
      if (!result) return res.status(404).json({ message: 'Route not found' });
      res.json({ message: 'Route deleted' });
    } catch (error) {
      console.error('Delete route error:', error);
      res.status(500).json({ message: 'Failed to delete route', error: error.message });
    }
  }
}

module.exports = RouteController;
